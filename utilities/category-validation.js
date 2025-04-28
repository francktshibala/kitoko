const { body, validationResult } = require("express-validator")
const utilities = require(".")

const validate = {}

/*  **********************************
 *  Category Data Validation Rules
 * ********************************* */
validate.categoryRules = () => {
  return [
    // category_name is required and must be string
    body("category_name")
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage("Category name must be between 2 and 50 characters."),
      
    // category_name cannot already exist in the database
    body("category_name")
      .custom(async (category_name) => {
        const categoryExists = await utilities.checkExistingCategory(category_name)
        if (categoryExists){
          throw new Error("Category name already exists. Please use a different name.")
        }
      }),
    
    // category_description is optional but must be a string if provided
    body("category_description")
      .optional()
      .isLength({ max: 1000 })
      .withMessage("Category description must be less than 1000 characters."),
      
    // category_image is optional but must be a valid URL if provided
    body("category_image")
      .optional()
      .isLength({ max: 255 })
      .withMessage("Image path too long.")
  ]
}

/* ******************************
 * Check data and return errors or continue
 * ***************************** */
validate.checkCategoryData = async (req, res, next) => {
  const { category_name, category_description, category_image } = req.body
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    
    res.render("services/add-category", {
      title: "Add New Category",
      nav,
      errors,
      category_name,
      category_description,
      category_image,
      messages: null,
    })
    return
  }
  next()
}

module.exports = validate