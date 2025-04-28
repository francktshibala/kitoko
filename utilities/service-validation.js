const { body, validationResult } = require("express-validator")
const utilities = require(".")

const validate = {}

/*  **********************************
 *  Service Data Validation Rules
 * ********************************* */
validate.serviceRules = () => {
  return [
    // category_id is required
    body("category_id")
      .notEmpty()
      .withMessage("Please select a category."),
      
    // service_name is required
    body("service_name")
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage("Service name must be between 2 and 100 characters."),
      
    // service_description is required
    body("service_description")
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage("Description must be between 10 and 2000 characters."),
      
    // service_price is required and must be a valid price
    body("service_price")
      .isFloat({ min: 0.01 })
      .withMessage("Price must be a valid number greater than 0."),
      
    // service_image is optional but must be a valid path if provided
    body("service_image")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Image path too long."),
      
    // service_thumbnail is optional but must be a valid path if provided
    body("service_thumbnail")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Thumbnail path too long."),
      
    // min_guests is optional but must be a valid number if provided
    body("min_guests")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Minimum guests must be a non-negative number."),
      
    // max_guests is optional but must be a valid number if provided
    body("max_guests")
      .optional()
      .isInt({ min: 1 })
      .withMessage("Maximum guests must be at least 1.")
      .custom((max_guests, { req }) => {
        const min_guests = req.body.min_guests;
        // If both values are provided, ensure max_guests is >= min_guests
        if (min_guests && max_guests && parseInt(max_guests) < parseInt(min_guests)) {
          throw new Error('Maximum guests must be greater than or equal to minimum guests.');
        }
        return true;
      })
  ]
}

/* ******************************
 * Check data and return errors or continue
 * ***************************** */
validate.checkServiceData = async (req, res, next) => {
  const { 
    category_id,
    service_name,
    service_description,
    service_price,
    service_image,
    service_thumbnail,
    min_guests,
    max_guests
  } = req.body
  
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    let categorySelect = await buildCategorySelect(category_id)
    
    res.render("services/add-service", {
      title: "Add New Service",
      nav,
      categorySelect,
      errors,
      category_id,
      service_name,
      service_description,
      service_price,
      service_image,
      service_thumbnail,
      min_guests,
      max_guests,
      messages: null
    })
    return
  }
  next()
}

// Helper function to build category select
async function buildCategorySelect(category_id) {
  const serviceModel = require("../models/service-model")
  let data = await serviceModel.getCategories()
  let select = '<select name="category_id" id="categorySelect" required>'
  select += '<option value="">Select a Category</option>'
  
  data.rows.forEach(row => {
    select += `<option value="${row.category_id}" ${category_id == row.category_id ? 'selected' : ''}>${row.category_name}</option>`
  })
  
  select += '</select>'
  return select
}

module.exports = validate