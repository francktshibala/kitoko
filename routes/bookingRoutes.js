const express = require("express")
const router = new express.Router()
const bookingController = require("../controllers/bookingController")
const utilities = require("../utilities")
const bookingValidate = require('../utilities/booking-validation')

// Route to build booking request form
router.get(
  "/request/:serviceId", 
  utilities.checkLogin, 
  utilities.handleErrors(bookingController.buildBookingRequest)
)

// Route to process booking request
router.post(
  "/request", 
  utilities.checkLogin,
  bookingValidate.bookingRules(),
  bookingValidate.checkBookingData, 
  utilities.handleErrors(bookingController.processBookingRequest)
)

// Route to view booking confirmation
router.get(
  "/confirmation/:bookingId", 
  utilities.checkLogin, 
  utilities.handleErrors(bookingController.buildBookingConfirmation)
)

// Route to view booking management page
router.get(
  "/management", 
  utilities.checkLogin, 
  utilities.handleErrors(bookingController.buildBookingManagement)
)

// Route to view booking details
router.get(
  "/detail/:bookingId", 
  utilities.checkLogin, 
  utilities.handleErrors(bookingController.buildBookingDetail)
)

// Route to update booking status (admin/employee only)
router.post(
  "/update-status", 
  utilities.checkLogin,
  utilities.checkAccountType, 
  utilities.handleErrors(bookingController.updateBookingStatus)
)

// Route to cancel booking
router.get(
  "/cancel/:bookingId", 
  utilities.checkLogin, 
  utilities.handleErrors(bookingController.cancelBooking)
)

module.exports = router