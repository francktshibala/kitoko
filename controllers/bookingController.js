const utilities = require("../utilities")
const serviceModel = require("../models/service-model")
const bookingModel = require("../models/booking-model")
const nodemailer = require("nodemailer")
require("dotenv").config()

const bookingController = {}

/* ************************
 *   Build booking request form
 * ************************ */
bookingController.buildBookingRequest = async function (req, res, next) {
  const service_id = req.params.serviceId
  const service = await serviceModel.getServiceById(service_id)
  
  if (!service) {
    req.flash("notice", "Service not found.")
    return res.redirect("/services")
  }
  
  const serviceOptions = await serviceModel.getServiceOptions(service_id)
  let nav = await utilities.getNav()
  
  res.render("bookings/request", {
    title: "Request Booking: " + service.service_name,
    nav,
    service,
    serviceOptions,
    utilities,
    messages: null,
    errors: null
  })
}

/* ************************
 *   Process booking request
 * ************************ */
bookingController.processBookingRequest = async function (req, res, next) {
  const { 
    service_id,
    event_date, 
    event_start_time, 
    event_end_time, 
    event_location, 
    guest_count, 
    event_type, 
    special_requests,
    selected_options
  } = req.body
  
  try {
    // Get account_id from JWT
    const account_id = res.locals.accountData.account_id
    
    // Get service price
    const service = await serviceModel.getServiceById(service_id)
    if (!service) {
      req.flash("notice", "Service not found.")
      return res.redirect("/services")
    }
    
    // Create booking
    const booking = await bookingModel.createBooking(
      account_id,
      event_date,
      event_start_time,
      event_end_time,
      event_location,
      guest_count,
      event_type,
      special_requests
    )
    
    // Add service to booking
    const bookingService = await bookingModel.addBookingService(
      booking.booking_id,
      service_id,
      1, // Default quantity
      service.service_price
    )
    
    // Calculate total amount
    let total = parseFloat(service.service_price)
    
    // Add options if selected
    if (selected_options && Array.isArray(selected_options)) {
      for (const option_id of selected_options) {
        // Get option details
        const option = await serviceModel.getServiceOptionById(option_id)
        if (option) {
          // Add option to booking
          await bookingModel.addBookingOption(
            bookingService.booking_service_id,
            option_id,
            1, // Default quantity
            option.option_price
          )
          
          // Add to total
          total += parseFloat(option.option_price)
        }
      }
    }
    
    // Update booking total
    await bookingModel.updateBookingTotal(booking.booking_id, total)
    
    // Send confirmation email
    await sendBookingConfirmationEmail(
      res.locals.accountData.account_email,
      res.locals.accountData.account_firstname,
      booking.booking_id,
      service.service_name
    )
    
    // Flash message and redirect
    req.flash(
      "notice",
      "Booking request submitted successfully! Reference #: " + booking.booking_id
    )
    res.redirect("/bookings/confirmation/" + booking.booking_id)
  } catch (error) {
    console.error("Error in processBookingRequest:", error)
    req.flash("notice", "Error submitting booking request. Please try again.")
    return res.redirect("/bookings/request/" + service_id)
  }
}

/* ************************
 *   Build booking confirmation page
 * ************************ */
bookingController.buildBookingConfirmation = async function (req, res, next) {
  const booking_id = req.params.bookingId
  const booking = await bookingModel.getBookingById(booking_id)
  
  if (!booking) {
    req.flash("notice", "Booking not found.")
    return res.redirect("/account")
  }
  
  // Make sure the booking belongs to the logged-in user or user is admin/employee
  if (booking.account_id !== res.locals.accountData.account_id && 
      res.locals.accountData.account_type !== "Admin" && 
      res.locals.accountData.account_type !== "Employee") {
    req.flash("notice", "You don't have permission to view this booking.")
    return res.redirect("/account")
  }
  
  const bookingServices = await bookingModel.getBookingServices(booking_id)
  
  // Get options for each service
  for (const service of bookingServices) {
    service.options = await bookingModel.getBookingOptions(service.booking_service_id)
  }
  
  let nav = await utilities.getNav()
  
  res.render("bookings/confirmation", {
    title: "Booking Confirmation",
    nav,
    booking,
    bookingServices,
    utilities,
    messages: req.flash("notice"),
    errors: null
  })
}

/* ************************
 *   Build booking management page
 * ************************ */
bookingController.buildBookingManagement = async function (req, res, next) {
  // Get account type
  const accountType = res.locals.accountData.account_type
  let bookings = []
  
  if (accountType === "Admin" || accountType === "Employee") {
    // Get all bookings for admin/employee
    bookings = await bookingModel.getAllBookings()
  } else {
    // Get only user's bookings
    bookings = await bookingModel.getBookingsByAccountId(res.locals.accountData.account_id)
  }
  
  let nav = await utilities.getNav()
  
  res.render("bookings/management", {
    title: "Manage Bookings",
    nav,
    bookings,
    accountType,
    utilities,
    messages: req.flash("notice"),
    errors: null
  })
}

/* ************************
 *   Build booking detail page
 * ************************ */
bookingController.buildBookingDetail = async function (req, res, next) {
  const booking_id = req.params.bookingId
  const booking = await bookingModel.getBookingById(booking_id)
  
  if (!booking) {
    req.flash("notice", "Booking not found.")
    return res.redirect("/bookings/management")
  }
  
  // Make sure the booking belongs to the logged-in user or user is admin/employee
  if (booking.account_id !== res.locals.accountData.account_id && 
      res.locals.accountData.account_type !== "Admin" && 
      res.locals.accountData.account_type !== "Employee") {
    req.flash("notice", "You don't have permission to view this booking.")
    return res.redirect("/account")
  }
  
  const bookingServices = await bookingModel.getBookingServices(booking_id)
  
  // Get options for each service
  for (const service of bookingServices) {
    service.options = await bookingModel.getBookingOptions(service.booking_service_id)
  }
  
  let nav = await utilities.getNav()
  
  res.render("bookings/detail", {
    title: "Booking Details",
    nav,
    booking,
    bookingServices,
    utilities,
    messages: req.flash("notice"),
    errors: null
  })
}

/* ************************
 *   Update booking status
 * ************************ */
bookingController.updateBookingStatus = async function (req, res, next) {
  const { booking_id, booking_status } = req.body
  
  // Make sure user is admin or employee
  if (res.locals.accountData.account_type !== "Admin" && 
      res.locals.accountData.account_type !== "Employee") {
    req.flash("notice", "You don't have permission to update booking status.")
    return res.redirect("/account")
  }
  
  try {
    const updatedBooking = await bookingModel.updateBookingStatus(booking_id, booking_status)
    
    if (!updatedBooking) {
      req.flash("notice", "Error updating booking status.")
      return res.redirect("/bookings/detail/" + booking_id)
    }
    
    // Get customer details for email notification
    const booking = await bookingModel.getBookingById(booking_id)
    
    // Send status update email
    await sendBookingStatusEmail(
      booking.account_email,
      booking.account_firstname,
      booking_id,
      booking_status
    )
    
    req.flash("notice", "Booking status updated successfully.")
    res.redirect("/bookings/detail/" + booking_id)
  } catch (error) {
    console.error("Error in updateBookingStatus:", error)
    req.flash("notice", "Error updating booking status.")
    return res.redirect("/bookings/detail/" + booking_id)
  }
}

/* ************************
 *   Cancel booking
 * ************************ */
bookingController.cancelBooking = async function (req, res, next) {
  const booking_id = req.params.bookingId
  const booking = await bookingModel.getBookingById(booking_id)
  
  if (!booking) {
    req.flash("notice", "Booking not found.")
    return res.redirect("/bookings/management")
  }
  
  // Make sure the booking belongs to the logged-in user or user is admin/employee
  if (booking.account_id !== res.locals.accountData.account_id && 
      res.locals.accountData.account_type !== "Admin" && 
      res.locals.accountData.account_type !== "Employee") {
    req.flash("notice", "You don't have permission to cancel this booking.")
    return res.redirect("/account")
  }
  
  try {
    const updatedBooking = await bookingModel.updateBookingStatus(booking_id, "cancelled")
    
    if (!updatedBooking) {
      req.flash("notice", "Error cancelling booking.")
      return res.redirect("/bookings/detail/" + booking_id)
    }
    
    // Send cancellation email
    await sendBookingCancellationEmail(
      booking.account_email,
      booking.account_firstname,
      booking_id
    )
    
    req.flash("notice", "Booking cancelled successfully.")
    res.redirect("/bookings/management")
  } catch (error) {
    console.error("Error in cancelBooking:", error)
    req.flash("notice", "Error cancelling booking.")
    return res.redirect("/bookings/detail/" + booking_id)
  }
}

/* ************************
 *   Helper function to send booking confirmation email
 * ************************ */
async function sendBookingConfirmationEmail(to, name, booking_id, service_name) {
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
      to: to,
      subject: "Booking Request Confirmation",
      html: `
        <h1>Booking Request Confirmation</h1>
        <p>Dear ${name},</p>
        <p>Thank you for your booking request with EventElegance. Your booking reference number is <strong>#${booking_id}</strong>.</p>
        <p>Service: ${service_name}</p>
        <p>Our team will review your booking request and get back to you shortly to confirm the details.</p>
        <p>You can view your booking details by logging into your account and visiting the bookings section.</p>
        <p>Thank you for choosing EventElegance for your special occasion!</p>
        <p>Best regards,<br>EventElegance Team</p>
      `
    }
    
    // Send email
    await transporter.sendMail(mailOptions)
    console.log("Booking confirmation email sent successfully")
  } catch (error) {
    console.error("Error sending booking confirmation email:", error)
  }
}

/* ************************
 *   Helper function to send booking status update email
 * ************************ */
async function sendBookingStatusEmail(to, name, booking_id, status) {
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
      to: to,
      subject: `Booking #${booking_id} Status Update`,
      html: `
        <h1>Booking Status Update</h1>
        <p>Dear ${name},</p>
        <p>Your booking (Reference #${booking_id}) has been updated to <strong>${status}</strong>.</p>
        <p>You can view your booking details by logging into your account and visiting the bookings section.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>EventElegance Team</p>
      `
    }
    
    // Send email
    await transporter.sendMail(mailOptions)
    console.log("Booking status update email sent successfully")
  } catch (error) {
    console.error("Error sending booking status email:", error)
  }
}

/* ************************
 *   Helper function to send booking cancellation email
 * ************************ */
async function sendBookingCancellationEmail(to, name, booking_id) {
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
      to: to,
      subject: `Booking #${booking_id} Cancellation`,
      html: `
        <h1>Booking Cancellation</h1>
        <p>Dear ${name},</p>
        <p>Your booking (Reference #${booking_id}) has been cancelled as requested.</p>
        <p>If you would like to make a new booking in the future, please visit our website.</p>
        <p>We hope to serve you soon for your future events!</p>
        <p>Best regards,<br>EventElegance Team</p>
      `
    }
    
    // Send email
    await transporter.sendMail(mailOptions)
    console.log("Booking cancellation email sent successfully")
  } catch (error) {
    console.error("Error sending booking cancellation email:", error)
  }
}

module.exports = bookingController