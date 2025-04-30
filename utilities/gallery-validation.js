const { body, validationResult } = require("express-validator")
const utilities = require(".")

const validate = {}

/* ************************
 *   Gallery image upload validation rules
 * ************************ */
validate.uploadRules = () => {
  return [
    // service_id is required
    body("service_id")
      .notEmpty()
      .withMessage("Please select a service for this image"),
      
    // image_title is required
    body("image_title")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Title must be between 2 and 100 characters"),
      
    // image_description is optional but must be a string
    body("image_description")
      .optional({ checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters")
  ]
}

/* ************************
 *   Gallery image update validation rules
 * ************************ */
validate.updateRules = () => {
  return [
    // gallery_id is required
    body("gallery_id")
      .notEmpty()
      .withMessage("Image ID is required"),
      
    // service_id is required
    body("service_id")
      .notEmpty()
      .withMessage("Please select a service for this image"),
      
    // image_title is required
    body("image_title")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Title must be between 2 and 100 characters"),
      
    // image_description is optional but must be a string
    body("image_description")
      .optional({ checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage("Description must be less than 500 characters")
  ]
}

/* ************************
 *   Check upload data and return errors or continue to upload
 * ************************ */
validate.checkUploadData = async (req, res, next) => {
  const { service_id, image_title, image_description } = req.body
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    // If there are validation errors, get services for dropdown
    const serviceModel = require("../models/service-model")
    const services = await serviceModel.getAllServices()
    let nav = await utilities.getNav()
    
    res.render("gallery/upload", {
      title: "Upload Image",
      nav,
      services,
      errors,
      service_id,
      image_title,
      image_description,
      utilities,
      messages: null
    })
    return
  }
  next()
}

/* ************************
 *   Check update data and return errors or continue to update
 * ************************ */
validate.checkUpdateData = async (req, res, next) => {
  const { gallery_id, service_id, image_title, image_description } = req.body
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    // If there are validation errors, get services for dropdown and image data
    const serviceModel = require("../models/service-model")
    const galleryModel = require("../models/gallery-model")
    const services = await serviceModel.getAllServices()
    const image = await galleryModel.getImageById(gallery_id)
    
    let nav = await utilities.getNav()
    
    res.render("gallery/edit", {
      title: "Edit Image",
      nav,
      image,
      services,
      errors,
      utilities,
      messages: null
    })
    return
  }
  next()
}

module.exports = validate