// utilities/message-validation.js
const { body, validationResult } = require("express-validator")
const utilities = require(".")

const validate = {}

/* ************************
 *   Contact form validation rules
 * ************************ */
validate.contactRules = () => {
  return [
    // guest_name is required if not logged in
    body("guest_name")
      .if((value, { req }) => !req.cookies.jwt)
      .notEmpty()
      .withMessage("Please provide your name")
      .isLength({ min: 2, max: 100 })
      .withMessage("Name must be between 2 and 100 characters"),
    
    // guest_email is required if not logged in
    body("guest_email")
      .if((value, { req }) => !req.cookies.jwt)
      .notEmpty()
      .withMessage("Please provide your email")
      .isEmail()
      .withMessage("Please provide a valid email address"),
    
    // guest_phone is optional but must be in correct format if provided
    body("guest_phone")
      .optional({ checkFalsy: true })
      .matches(/^\d{3}-\d{3}-\d{4}$/)
      .withMessage("Phone must be in the format: 123-456-7890"),
    
    // message_subject is required
    body("message_subject")
      .notEmpty()
      .withMessage("Please provide a subject")
      .isLength({ min: 2, max: 100 })
      .withMessage("Subject must be between 2 and 100 characters"),
    
    // message_body is required
    body("message_body")
      .notEmpty()
      .withMessage("Please provide a message")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Message must be between 10 and 2000 characters")
  ]
}

/* ************************
 *   Reply message validation rules
 * ************************ */
validate.replyRules = () => {
  return [
    // parent_id is required
    body("parent_id")
      .notEmpty()
      .withMessage("Parent message ID is required"),
    
    // message_body is required
    body("message_body")
      .notEmpty()
      .withMessage("Please provide a reply message")
      .isLength({ min: 10, max: 2000 })
      .withMessage("Message must be between 10 and 2000 characters")
  ]
}

/* ************************
 *   Check contact form data
 * ************************ */
validate.checkContactData = async (req, res, next) => {
  const { guest_name, guest_email, guest_phone, message_subject, message_body } = req.body
  let errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    let nav = await utilities.getNav()
    
    res.render("messages/contact", {
      title: "Contact Us",
      nav,
      errors,
      guest_name: guest_name || "",
      guest_email: guest_email || "",
      guest_phone: guest_phone || "",
      message_subject: message_subject || "",
      message_body: message_body || "",
      messages: null
    })
    return
  }
  next()
}

/* ************************
 *   Check reply message data
 * ************************ */
validate.checkReplyData = async (req, res, next) => {
  const { parent_id, message_body } = req.body
  let errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    req.flash("notice", errors.array()[0].msg)
    res.redirect(`/messages/view/${parent_id}`)
    return
  }
  next()
}

module.exports = validate