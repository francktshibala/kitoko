// routes/messageRoutes.js
const express = require("express")
const router = express.Router()
const messageController = require("../controllers/messageController")
const utilities = require("../utilities")
const messageValidate = require("../utilities/message-validation")

// Route to build contact form view
router.get("/contact", utilities.handleErrors(messageController.buildContactForm))

// Route to process contact form
router.post(
  "/contact",
  messageValidate.contactRules(),
  messageValidate.checkContactData,
  utilities.handleErrors(messageController.processContactForm)
)

// Route to build confirmation view
router.get("/confirmation", utilities.handleErrors(messageController.buildConfirmation))

// Route to build inbox view (admin only)
router.get(
  "/inbox", 
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(messageController.buildInbox)
)

// Route to view specific message
router.get(
  "/view/:messageId", 
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(messageController.buildViewMessage)
)

// Route to process reply
router.post(
  "/reply",
  utilities.checkLogin,
  utilities.checkAccountType,
  messageValidate.replyRules(),
  messageValidate.checkReplyData,
  utilities.handleErrors(messageController.processReply)
)

// Route to toggle read status
router.post(
  "/toggle-read",
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(messageController.toggleReadStatus)
)

// Route to get unread count
router.get(
  "/unread-count",
  utilities.checkLogin,
  utilities.checkAccountType,
  utilities.handleErrors(messageController.getUnreadCount)
)

module.exports = router