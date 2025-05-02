// controllers/messageController.js
const utilities = require("../utilities")
const messageModel = require("../models/message-model")
const nodemailer = require("nodemailer")
require("dotenv").config()

const messageController = {}

/* ************************
 *  Build contact form view
 * ************************ */
messageController.buildContactForm = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    
    res.render("messages/contact", {
      title: "Contact Us",
      nav,
      errors: null,
      messages: null
    })
  } catch (error) {
    next(error)
  }
}

/* ************************
 *  Process contact form
 * ************************ */
messageController.processContactForm = async function (req, res, next) {
  try {
    const { 
      guest_name, 
      guest_email, 
      guest_phone, 
      message_subject, 
      message_body 
    } = req.body
    
    // Create message object
    const messageData = {
      account_id: res.locals.accountData?.account_id || null,
      guest_name,
      guest_email,
      guest_phone,
      message_subject,
      message_body
    }
    
    // Save message to database
    const result = await messageModel.createMessage(messageData)
    
    if (result) {
      // Send notification email to admin
      await sendNotificationEmail(messageData)
      
      // If user is logged in, also send confirmation
      if (res.locals.accountData) {
        await sendConfirmationEmail(
          res.locals.accountData.account_email,
          res.locals.accountData.account_firstname,
          message_subject
        )
      } else {
        // Send confirmation to guest email
        await sendConfirmationEmail(
          guest_email,
          guest_name,
          message_subject
        )
      }
      
      req.flash("notice", "Your message has been sent! We'll get back to you soon.")
      return res.redirect("/messages/confirmation")
    } else {
      req.flash("notice", "Error sending message. Please try again.")
      return res.status(500).redirect("/contact")
    }
  } catch (error) {
    next(error)
  }
}

/* ************************
 *  Build confirmation view
 * ************************ */
messageController.buildConfirmation = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    
    res.render("messages/confirmation", {
      title: "Message Sent",
      nav,
      messages: req.flash("notice")
    })
  } catch (error) {
    next(error)
  }
}

/* ************************
 *  Build inbox view
 * ************************ */
messageController.buildInbox = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    
    // Get all messages
    const messages = await messageModel.getAllMessages()
    
    // Group messages into threads based on parent_id
    const threads = {}
    
    messages.forEach(message => {
      // Use the parent_id if exists, otherwise use message_id as thread root
      const threadId = message.parent_id || message.message_id
      
      if (!threads[threadId]) {
        threads[threadId] = []
      }
      
      // Add message to thread
      threads[threadId].push(message)
    })
    
    // Sort threads by most recent activity
    const sortedThreads = Object.values(threads).sort((a, b) => {
      const aLatest = a.reduce((latest, msg) => 
        msg.created_at > latest ? msg.created_at : latest, a[0].created_at)
      const bLatest = b.reduce((latest, msg) => 
        msg.created_at > latest ? msg.created_at : latest, b[0].created_at)
      
      return new Date(bLatest) - new Date(aLatest)
    })
    
    res.render("messages/inbox", {
      title: "Message Inbox",
      nav,
      threads: sortedThreads,
      utilities,
      messages: req.flash("notice")
    })
  } catch (error) {
    next(error)
  }
}

/* ************************
 *  Build view message view
 * ************************ */
messageController.buildViewMessage = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    const message_id = req.params.messageId
    
    // Get message thread
    const thread = await messageModel.getMessageThread(message_id)
    
    if (!thread || thread.length === 0) {
      req.flash("notice", "Message not found.")
      return res.redirect("/messages/inbox")
    }
    
    // Mark message as read
    await messageModel.updateMessageReadStatus(message_id, true)
    
    res.render("messages/view", {
      title: "View Message",
      nav,
      thread,
      original_message_id: message_id,
      utilities,
      messages: req.flash("notice")
    })
  } catch (error) {
    next(error)
  }
}

/* ************************
 *  Process reply message
 * ************************ */
messageController.processReply = async function (req, res, next) {
  try {
    const { parent_id, message_body } = req.body
    
    // Get original message
    const originalMessage = await messageModel.getMessageById(parent_id)
    
    if (!originalMessage) {
      req.flash("notice", "Original message not found.")
      return res.redirect("/messages/inbox")
    }
    
    // Create reply message
    const messageData = {
      account_id: res.locals.accountData.account_id,
      guest_name: null,
      guest_email: null,
      guest_phone: null,
      message_subject: `Re: ${originalMessage.message_subject}`,
      message_body,
      parent_id
    }
    
    const result = await messageModel.createMessage(messageData)
    
    if (result) {
      // Send notification email to recipient about reply
      await sendReplyNotification(
        originalMessage.guest_email || originalMessage.account_email,
        originalMessage.guest_name || `${originalMessage.account_firstname} ${originalMessage.account_lastname}`,
        originalMessage.message_subject
      )
      
      req.flash("notice", "Your reply has been sent!")
      return res.redirect(`/messages/view/${parent_id}`)
    } else {
      req.flash("notice", "Error sending reply. Please try again.")
      return res.redirect(`/messages/view/${parent_id}`)
    }
  } catch (error) {
    next(error)
  }
}

/* ************************
 *  Toggle message read status
 * ************************ */
messageController.toggleReadStatus = async function (req, res, next) {
  try {
    const { message_id, is_read } = req.body
    const newStatus = is_read === 'true' ? false : true
    
    const result = await messageModel.updateMessageReadStatus(message_id, newStatus)
    
    if (result) {
      res.json({ success: true, new_status: newStatus })
    } else {
      res.status(500).json({ success: false, message: "Failed to update status" })
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

/* ************************
 *  Get unread message count
 * ************************ */
messageController.getUnreadCount = async function (req, res, next) {
  try {
    const count = await messageModel.countUnreadMessages()
    res.json({ count })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/* ************************
 *  Helper function to send notification email
 * ************************ */
async function sendNotificationEmail(messageData) {
  try {
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    
    // Email content
    const mailOptions = {
      from: process.env.SMTP_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `New Message: ${messageData.message_subject}`,
      html: `
        <h1>New Contact Message</h1>
        <p><strong>From:</strong> ${messageData.guest_name} (${messageData.guest_email})</p>
        <p><strong>Subject:</strong> ${messageData.message_subject}</p>
        <p><strong>Message:</strong></p>
        <p>${messageData.message_body.replace(/\n/g, '<br>')}</p>
        <p><a href="${process.env.BASE_URL || 'http://localhost:8080'}/messages/inbox">View in Admin Dashboard</a></p>
      `
    }
    
    // Send email
    await transporter.sendMail(mailOptions)
    console.log("Notification email sent successfully")
  } catch (error) {
    console.error("Error sending notification email:", error)
  }
}

/* ************************
 *  Helper function to send confirmation email
 * ************************ */
async function sendConfirmationEmail(email, name, subject) {
  try {
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    
    // Email content
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: `Message Received: ${subject}`,
      html: `
        <h1>Thank You for Contacting Us</h1>
        <p>Dear ${name},</p>
        <p>We have received your message regarding "${subject}".</p>
        <p>Our team will review your message and get back to you as soon as possible.</p>
        <p>Thank you for choosing EventKitoko for your event needs!</p>
        <p>Best regards,<br>EventKitoko Team</p>
      `
    }
    
    // Send email
    await transporter.sendMail(mailOptions)
    console.log("Confirmation email sent successfully")
  } catch (error) {
    console.error("Error sending confirmation email:", error)
  }
}

/* ************************
 *  Helper function to send reply notification email
 * ************************ */
async function sendReplyNotification(email, name, subject) {
  try {
    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    })
    
    // Email content
    const mailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: `New Reply: ${subject}`,
      html: `
        <h1>New Reply to Your Message</h1>
        <p>Dear ${name},</p>
        <p>We have responded to your message regarding "${subject}".</p>
        <p>You can view our response by logging into your account or by replying to this email.</p>
        <p>Thank you for choosing EventKitoko for your event needs!</p>
        <p>Best regards,<br>EventKitoko Team</p>
      `
    }
    
    // Send email
    await transporter.sendMail(mailOptions)
    console.log("Reply notification email sent successfully")
  } catch (error) {
    console.error("Error sending reply notification email:", error)
  }
}

module.exports = messageController