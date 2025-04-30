const express = require("express")
const router = express.Router()
const galleryController = require("../controllers/galleryController")
const utilities = require("../utilities")
const galleryValidate = require("../utilities/gallery-validation")

// Route to build gallery view
router.get("/", utilities.handleErrors(galleryController.buildGallery))

// Route to build gallery management view (admin only)
router.get(
  "/management", 
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(galleryController.buildGalleryManagement)
)

// Route to build image upload form (admin only)
router.get(
  "/upload", 
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(galleryController.buildUploadForm)
)

// Route to process image upload (admin only)
router.post(
  "/upload",
  utilities.checkLogin,
  utilities.checkAccountType,
  galleryController.upload.single("image"),
  galleryValidate.uploadRules(),
  galleryValidate.checkUploadData,
  utilities.handleErrors(galleryController.uploadImage)
)

// Route to build edit image form (admin only)
router.get(
  "/edit/:galleryId", 
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(galleryController.buildEditImage)
)

// Route to process image update (admin only)
router.post(
  "/update",
  utilities.checkLogin,
  utilities.checkAccountType,
  galleryValidate.updateRules(),
  galleryValidate.checkUpdateData,
  utilities.handleErrors(galleryController.updateImage)
)

// Route to delete image (admin only)
router.get(
  "/delete/:galleryId", 
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(galleryController.deleteImage)
)

// Route to toggle featured status (admin only)
router.get(
  "/toggle-featured/:galleryId/:featured", 
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(galleryController.toggleFeatured)
)

module.exports = router