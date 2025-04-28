const utilities = require(".")
const { body, validationResult } = require("express-validator")
const accountModel = require("../models/account-model")

/* ************************
 * Registration Data Validation Rules
 ************************* */
const validate = {}

// Registration rules
validate.registrationRules = () => {
  return [
    // firstname is required and must be a string
    body("account_firstname")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    // lastname is required and must be a string
    body("account_lastname")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a last name."),

    // valid email is required
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists) {
          throw new Error("Email already exists. Please log in or use a different email")
        }
      }),

    // password must be strong
    body("account_password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."),
      
    // phone is optional but must be in correct format if provided
    body("account_phone")
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^\d{3}-\d{3}-\d{4}$/)
      .withMessage("Phone must be in the format: 123-456-7890")
  ]
}

// Login rules
validate.loginRules = () => {
  return [
    // valid email is required
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required."),

    // password is required
    body("account_password")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a password."),
  ]
}

// Account update rules
validate.accountUpdateRules = () => {
  return [
    // account_id is required
    body("account_id")
      .trim()
      .isInt()
      .withMessage("Invalid account ID."),

    // firstname is required and must be a string
    body("account_firstname")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    // lastname is required and must be a string
    body("account_lastname")
      .trim()
      .isLength({ min: 1 })
      .withMessage("Please provide a last name."),

    // valid email is required
    body("account_email")
      .trim()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email, { req }) => {
        const account_id = req.body.account_id
        const account = await accountModel.getAccountById(account_id)
        // Check if email exists and isn't the same as the current account email
        const emailExists = await accountModel.checkExistingEmail(account_email)
        if (emailExists && account.account_email !== account_email) {
          throw new Error("Email already exists. Please use a different email")
        }
        return true
      }),
      
    // phone is optional but must be in correct format if provided
    body("account_phone")
      .optional({ checkFalsy: true })
      .trim()
      .matches(/^\d{3}-\d{3}-\d{4}$/)
      .withMessage("Phone must be in the format: 123-456-7890")
  ]
}

// Password rules for update
validate.passwordRules = () => {
  return [
    // account_id is required
    body("account_id")
      .trim()
      .isInt()
      .withMessage("Invalid account ID."),
      
    // password must be strong
    body("account_password")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters long.")
      .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
      .withMessage("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character."),
  ]
}

/* ************************
 * Check Registration Data and returns errors or continues to registration
 ************************* */
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email, account_phone } = req.body
  let errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("account/register", {
      errors,
      title: "Registration",
      nav,
      account_firstname,
      account_lastname,
      account_email,
      account_phone,
      messages: null,
    })
    return
  }
  next()
}

/* ************************
 * Check Login Data and returns errors or continues to login
 ************************* */
validate.checkLoginData = async (req, res, next) => {
  const { account_email, redirect } = req.body
  let errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("account/login", {
      errors,
      title: "Login",
      nav,
      account_email,
      redirect,
      messages: null,
    })
    return
  }
  next()
}

/* ************************
 * Check Account Update Data and returns errors or continues to update
 ************************* */
validate.checkAccountData = async (req, res, next) => {
  const { account_id, account_firstname, account_lastname, account_email, account_phone } = req.body
  let errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    res.render("account/update", {
      errors,
      title: "Update Account",
      nav,
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      account_phone,
      messages: null,
    })
    return
  }
  next()
}

/* ************************
 * Check Password Data and returns errors or continues to update
 ************************* */
validate.checkPasswordData = async (req, res, next) => {
  const { account_id } = req.body
  let errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    const account = await accountModel.getAccountById(account_id)
    
    res.render("account/update", {
      errors,
      title: "Update Account",
      nav,
      account_id,
      account_firstname: account.account_firstname,
      account_lastname: account.account_lastname,
      account_email: account.account_email,
      account_phone: account.account_phone,
      messages: null,
    })
    return
  }
  next()
}

module.exports = validate