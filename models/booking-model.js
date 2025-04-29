const pool = require("../database/")

/* ************************
 *   Create a new booking
 * ************************ */
async function createBooking(
  account_id,
  event_date,
  event_start_time,
  event_end_time,
  event_location,
  guest_count,
  event_type,
  special_requests = null
) {
  try {
    const sql = `
      INSERT INTO booking (
        account_id,
        event_date,
        event_start_time,
        event_end_time,
        event_location,
        guest_count,
        event_type,
        booking_status,
        special_requests
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending', $8)
      RETURNING *
    `
    const result = await pool.query(sql, [
      account_id,
      event_date,
      event_start_time,
      event_end_time,
      event_location,
      guest_count,
      event_type,
      special_requests
    ])
    
    return result.rows[0]
  } catch (error) {
    console.error("Error in createBooking:", error)
    throw error
  }
}

/* ************************
 *   Add service to booking
 * ************************ */
async function addBookingService(booking_id, service_id, quantity, price_at_booking) {
  try {
    const sql = `
      INSERT INTO booking_service (
        booking_id,
        service_id,
        quantity,
        price_at_booking
      ) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await pool.query(sql, [
      booking_id,
      service_id,
      quantity,
      price_at_booking
    ])
    
    return result.rows[0]
  } catch (error) {
    console.error("Error in addBookingService:", error)
    throw error
  }
}

/* ************************
 *   Add option to booking service
 * ************************ */
async function addBookingOption(booking_service_id, option_id, quantity, price_at_booking) {
  try {
    const sql = `
      INSERT INTO booking_option (
        booking_service_id,
        option_id,
        quantity,
        price_at_booking
      ) 
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const result = await pool.query(sql, [
      booking_service_id,
      option_id,
      quantity,
      price_at_booking
    ])
    
    return result.rows[0]
  } catch (error) {
    console.error("Error in addBookingOption:", error)
    throw error
  }
}

/* ************************
 *   Get booking by ID
 * ************************ */
async function getBookingById(booking_id) {
  try {
    const sql = `
      SELECT b.*, 
             a.account_firstname, a.account_lastname, a.account_email, a.account_phone
      FROM booking b
      JOIN account a ON b.account_id = a.account_id
      WHERE b.booking_id = $1
    `
    const result = await pool.query(sql, [booking_id])
    
    return result.rows[0]
  } catch (error) {
    console.error("Error in getBookingById:", error)
    return null
  }
}

/* ************************
 *   Get bookings by account ID
 * ************************ */
async function getBookingsByAccountId(account_id) {
  try {
    const sql = `
      SELECT b.*,
             STRING_AGG(DISTINCT s.service_name, ', ') as services
      FROM booking b
      LEFT JOIN booking_service bs ON b.booking_id = bs.booking_id
      LEFT JOIN service s ON bs.service_id = s.service_id
      WHERE b.account_id = $1
      GROUP BY b.booking_id
      ORDER BY b.event_date DESC
    `
    const result = await pool.query(sql, [account_id])
    
    return result.rows
  } catch (error) {
    console.error("Error in getBookingsByAccountId:", error)
    return []
  }
}

/* ************************
 *   Get booking services
 * ************************ */
async function getBookingServices(booking_id) {
  try {
    const sql = `
      SELECT bs.*, s.service_name, s.service_image
      FROM booking_service bs
      JOIN service s ON bs.service_id = s.service_id
      WHERE bs.booking_id = $1
    `
    const result = await pool.query(sql, [booking_id])
    
    return result.rows
  } catch (error) {
    console.error("Error in getBookingServices:", error)
    return []
  }
}

/* ************************
 *   Get booking options
 * ************************ */
async function getBookingOptions(booking_service_id) {
  try {
    const sql = `
      SELECT bo.*, o.option_name
      FROM booking_option bo
      JOIN service_option o ON bo.option_id = o.option_id
      WHERE bo.booking_service_id = $1
    `
    const result = await pool.query(sql, [booking_service_id])
    
    return result.rows
  } catch (error) {
    console.error("Error in getBookingOptions:", error)
    return []
  }
}

/* ************************
 *   Update booking status
 * ************************ */
async function updateBookingStatus(booking_id, status) {
  try {
    const sql = `
      UPDATE booking
      SET booking_status = $1
      WHERE booking_id = $2
      RETURNING *
    `
    const result = await pool.query(sql, [status, booking_id])
    
    return result.rows[0]
  } catch (error) {
    console.error("Error in updateBookingStatus:", error)
    return null
  }
}

/* ************************
 *   Update booking total amount
 * ************************ */
async function updateBookingTotal(booking_id, total_amount) {
  try {
    const sql = `
      UPDATE booking
      SET total_amount = $1
      WHERE booking_id = $2
      RETURNING *
    `
    const result = await pool.query(sql, [total_amount, booking_id])
    
    return result.rows[0]
  } catch (error) {
    console.error("Error in updateBookingTotal:", error)
    return null
  }
}

/* ************************
 *   Get all bookings (for admin)
 * ************************ */
async function getAllBookings() {
  try {
    const sql = `
      SELECT b.*, 
             a.account_firstname, a.account_lastname,
             STRING_AGG(DISTINCT s.service_name, ', ') as services
      FROM booking b
      JOIN account a ON b.account_id = a.account_id
      LEFT JOIN booking_service bs ON b.booking_id = bs.booking_id
      LEFT JOIN service s ON bs.service_id = s.service_id
      GROUP BY b.booking_id, a.account_firstname, a.account_lastname
      ORDER BY b.event_date DESC
    `
    const result = await pool.query(sql)
    
    return result.rows
  } catch (error) {
    console.error("Error in getAllBookings:", error)
    return []
  }
}

module.exports = {
  createBooking,
  addBookingService,
  addBookingOption,
  getBookingById,
  getBookingsByAccountId,
  getBookingServices,
  getBookingOptions,
  updateBookingStatus,
  updateBookingTotal,
  getAllBookings
}