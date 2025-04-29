const { body, validationResult } = require("express-validator")
const utilities = require(".")

const validate = {}

/* ************************
 *   Booking data validation rules
 * ************************ */
validate.bookingRules = () => {
  return [
    // service_id is required
    body("service_id")
      .notEmpty()
      .withMessage("Service is required."),
      
    // event_date is required and must be a valid date in the future
    body("event_date")
      .notEmpty()
      .withMessage("Event date is required.")
      .isDate()
      .withMessage("Please provide a valid date.")
      .custom(value => {
        const eventDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (eventDate < today) {
          throw new Error("Event date must be in the future.");
        }
        return true;
      }),
      
    // event_start_time is required and must be a valid time
    body("event_start_time")
      .notEmpty()
      .withMessage("Start time is required.")
      .matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Please provide a valid start time (HH:MM)."),
      
    // event_end_time is required and must be a valid time after start time
    body("event_end_time")
      .notEmpty()
      .withMessage("End time is required.")
      .matches(/^(0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/)
      .withMessage("Please provide a valid end time (HH:MM).")
      .custom((value, { req }) => {
        const startTime = req.body.event_start_time;
        const endTime = value;
        if (startTime && endTime && endTime <= startTime) {
          throw new Error("End time must be after start time.");
        }
        return true;
      }),
      
    // event_location is required
    body("event_location")
      .notEmpty()
      .withMessage("Event location is required.")
      .isLength({ min: 5, max: 200 })
      .withMessage("Location must be between 5 and 200 characters."),
      
    // guest_count is required and must be a positive number
    body("guest_count")
      .notEmpty()
      .withMessage("Guest count is required.")
      .isInt({ min: 1 })
      .withMessage("Guest count must be at least 1."),
      
    // event_type is required
    body("event_type")
      .notEmpty()
      .withMessage("Event type is required.")
      .isLength({ min: 2, max: 50 })
      .withMessage("Event type must be between 2 and 50 characters."),
      
    // special_requests is optional but must be a string if provided
    body("special_requests")
      .optional({ checkFalsy: true })
      .isLength({ max: 500 })
      .withMessage("Special requests must be less than 500 characters.")
  ]
}

/* ************************
 *   Check booking data and return errors or continue to booking process
 * ************************ */
validate.checkBookingData = async (req, res, next) => {
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
  
  const errors = validationResult(req)
  
  if (!errors.isEmpty()) {
    // Get service and options for re-rendering the form
    const serviceModel = require("../models/service-model")
    const service = await serviceModel.getServiceById(service_id)
    const serviceOptions = await serviceModel.getServiceOptions(service_id)
    
    let nav = await utilities.getNav()
    
    res.render("bookings/request", {
      title: "Request Booking: " + (service ? service.service_name : ""),
      nav,
      service,
      serviceOptions,
      utilities,
      errors,
      event_date,
      event_start_time,
      event_end_time,
      event_location,
      guest_count,
      event_type,
      special_requests,
      selected_options: selected_options || [],
      messages: null
    })
    return
  }
  next()
}

module.exports = validate