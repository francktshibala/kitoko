const utilities = require("../utilities")
const galleryModel = require("../models/gallery-model")
const serviceModel = require("../models/service-model")
const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const multer = require("multer")

/* Set up storage for file uploads */
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Ensure directory exists
    const uploadDir = "./public/images/uploads";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir)
  },
  filename: function (req, file, cb) {
    // Generate safer filename
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const ext = path.extname(file.originalname)
    cb(null, file.fieldname + "-" + uniqueSuffix + ext)
  }
})

/* Set up file filter to only accept images */
const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(new Error("Only image files are allowed"), false)
  }
}

/* Create the upload middleware */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
})

const galleryController = {}

/* ***************************
 *  Build gallery view
 * ************************** */
galleryController.buildGallery = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    let gallery = []
    
    // Get filter parameters
    const categoryId = req.query.category || null
    const serviceId = req.query.service || null
    
    // Fetch gallery images based on filters
    if (serviceId) {
      gallery = await galleryModel.getImagesByService(serviceId)
    } else if (categoryId) {
      gallery = await galleryModel.getImagesByCategory(categoryId)
    } else {
      gallery = await galleryModel.getAllImages()
    }
    
    // Get all categories for filter dropdown
    const categoryData = await serviceModel.getCategories()
    const categories = categoryData.rows || []
    
    // Get all services for filter dropdown
    const services = await serviceModel.getAllServices()
    
    res.render("gallery/index", {
      title: "Gallery",
      nav,
      gallery,
      categories,
      services,
      selectedCategory: categoryId,
      selectedService: serviceId,
      utilities,
      messages: req.flash("notice"),
      errors: null
    })
  } catch (error) {
    console.error("Error in buildGallery:", error)
    next(error)
  }
}

/* ***************************
 *  Build gallery management view
 * ************************** */
galleryController.buildGalleryManagement = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    
    // Get all images
    const gallery = await galleryModel.getAllImages()
    
    res.render("gallery/management", {
      title: "Gallery Management",
      nav,
      gallery,
      utilities,
      messages: req.flash("notice"),
      errors: null
    })
  } catch (error) {
    console.error("Error in buildGalleryManagement:", error)
    next(error)
  }
}

/* ***************************
 *  Build gallery upload view
 * ************************** */
galleryController.buildUploadForm = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    
    // Get services for dropdown
    const services = await serviceModel.getAllServices()
    
    res.render("gallery/upload", {
      title: "Upload Image",
      nav,
      services,
      utilities,
      messages: req.flash("notice"),
      errors: null
    })
  } catch (error) {
    console.error("Error in buildUploadForm:", error)
    next(error)
  }
}

/* ***************************
 *  Process image upload
 * ************************** */
galleryController.uploadImage = async function (req, res, next) {
  try {
    console.log("Starting image upload process");
    
    // Get form data
    const { service_id, image_title, image_description, is_featured } = req.body
    console.log("Form data received:", { service_id, image_title, is_featured });
    
    const featured = is_featured ? true : false
    
    // Check if a file was uploaded
    if (!req.file) {
      req.flash("notice", "Please select an image to upload")
      return res.redirect("/gallery/upload")
    }
    
    console.log("File uploaded:", req.file.path);
    
    // Create necessary directories
    const originalPath = req.file.path
    const fileName = path.basename(originalPath)
    const optimizedDir = path.join("./public/images/gallery")
    const thumbnailDir = path.join("./public/images/gallery/thumbnails")
    
    // Create directories if they don't exist
    if (!fs.existsSync(optimizedDir)) {
      fs.mkdirSync(optimizedDir, { recursive: true })
      console.log("Created directory:", optimizedDir);
    }
    if (!fs.existsSync(thumbnailDir)) {
      fs.mkdirSync(thumbnailDir, { recursive: true })
      console.log("Created directory:", thumbnailDir);
    }
    
    console.log("Processing image with sharp");
    try {
      // Resize and optimize the image
      const optimizedPath = path.join(optimizedDir, fileName)
      await sharp(originalPath)
        .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 80 })
        .toFile(optimizedPath)
      
      console.log("Main image processed:", optimizedPath);
      
      // Create a thumbnail
      const thumbnailPath = path.join(thumbnailDir, fileName)
      await sharp(originalPath)
        .resize(400, 300, { fit: "cover" })
        .jpeg({ quality: 70 })
        .toFile(thumbnailPath)
      
      console.log("Thumbnail processed:", thumbnailPath);
      
      // WINDOWS FIX: Instead of deleting the original upload, just keep it
      // This avoids the EPERM: operation not permitted error on Windows
      // The uploaded files will be cleaned up by the system later or can be handled by a maintenance script
      // Comment out the deletion for now:
      /*
      if (fs.existsSync(optimizedPath) && fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(originalPath)
        console.log("Original file deleted");
      }
      */
      
      // Store the path relative to public directory
      const dbImagePath = "/images/gallery/" + fileName
      
      console.log("Adding image to database:", dbImagePath);
      
      // Add image to database
      const result = await galleryModel.addImage(
        service_id,
        dbImagePath,
        image_title,
        image_description,
        featured
      )
      
      if (result) {
        req.flash("notice", "Image uploaded successfully")
        return res.redirect("/gallery/management")
      } else {
        req.flash("notice", "Upload failed, please try again")
        return res.redirect("/gallery/upload")
      }
    } catch (sharpError) {
      console.error("Error processing image with Sharp:", sharpError)
      req.flash("notice", "Error processing image: " + sharpError.message)
      return res.redirect("/gallery/upload")
    }
  } catch (error) {
    console.error("Error in uploadImage:", error)
    req.flash("notice", "Error uploading image: " + error.message)
    return res.redirect("/gallery/upload")
  }
}

/* ***************************
 *  Build edit image view
 * ************************** */
galleryController.buildEditImage = async function (req, res, next) {
  try {
    const nav = await utilities.getNav()
    const galleryId = req.params.galleryId
    
    // Get image data
    const image = await galleryModel.getImageById(galleryId)
    
    if (!image) {
      req.flash("notice", "Image not found")
      return res.redirect("/gallery/management")
    }
    
    // Get services for dropdown
    const services = await serviceModel.getAllServices()
    
    res.render("gallery/edit", {
      title: "Edit Image",
      nav,
      image,
      services,
      utilities,
      messages: req.flash("notice"),
      errors: null
    })
  } catch (error) {
    console.error("Error in buildEditImage:", error)
    next(error)
  }
}

/* ***************************
 *  Process image update
 * ************************** */
galleryController.updateImage = async function (req, res, next) {
  try {
    const { gallery_id, service_id, image_title, image_description, is_featured } = req.body
    const featured = is_featured ? true : false
    
    // Update image in database
    const result = await galleryModel.updateImage(
      gallery_id,
      service_id,
      image_title,
      image_description,
      featured
    )
    
    if (result) {
      req.flash("notice", "Image updated successfully")
    } else {
      req.flash("notice", "Update failed, please try again")
    }
    
    return res.redirect("/gallery/management")
  } catch (error) {
    console.error("Error in updateImage:", error)
    req.flash("notice", "Error updating image: " + error.message)
    return res.redirect("/gallery/management")
  }
}

/* ***************************
 *  Process image deletion
 * ************************** */
galleryController.deleteImage = async function (req, res, next) {
  try {
    const galleryId = req.params.galleryId
    
    // Get image path before deleting from database
    const image = await galleryModel.getImageById(galleryId)
    
    if (!image) {
      req.flash("notice", "Image not found")
      return res.redirect("/gallery/management")
    }
    
    // WINDOWS FIX: Add try-catch for each file deletion operation
    // Delete image file from filesystem with error handling
    const imagePath = path.join("./public", image.image_path)
    const thumbnailPath = path.join("./public/images/gallery/thumbnails", path.basename(image.image_path))
    
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath)
      }
    } catch (fsError) {
      console.error("Error deleting main image file:", fsError)
      // Continue with deletion even if file deletion fails
    }
    
    try {
      if (fs.existsSync(thumbnailPath)) {
        fs.unlinkSync(thumbnailPath)
      }
    } catch (fsError) {
      console.error("Error deleting thumbnail file:", fsError)
      // Continue with deletion even if file deletion fails
    }
    
    // Delete from database
    const result = await galleryModel.deleteImage(galleryId)
    
    if (result) {
      req.flash("notice", "Image deleted successfully")
    } else {
      req.flash("notice", "Deletion failed, please try again")
    }
    
    return res.redirect("/gallery/management")
  } catch (error) {
    console.error("Error in deleteImage:", error)
    req.flash("notice", "Error deleting image: " + error.message)
    return res.redirect("/gallery/management")
  }
}

/* ***************************
 *  Toggle featured status
 * ************************** */
galleryController.toggleFeatured = async function (req, res, next) {
  try {
    const galleryId = req.params.galleryId
    const featured = req.params.featured === "true"
    
    const result = await galleryModel.toggleFeatured(galleryId, !featured)
    
    if (result) {
      req.flash("notice", `Image ${!featured ? "added to" : "removed from"} featured images`)
    } else {
      req.flash("notice", "Operation failed, please try again")
    }
    
    return res.redirect("/gallery/management")
  } catch (error) {
    console.error("Error in toggleFeatured:", error)
    req.flash("notice", "Error updating featured status: " + error.message)
    return res.redirect("/gallery/management")
  }
}

// Export the upload middleware for use in routes
galleryController.upload = upload

module.exports = galleryController