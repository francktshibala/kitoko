const pool = require("../database/")
const bcrypt = require("bcryptjs")

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password, account_phone = null) {
  try {
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_phone) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_password, account_phone])
    return result.rowCount > 0
  } catch (error) {
    return error.message
  }
}

/* ****************************
 *   Check for existing email
 * ************************** */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}

/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail(account_email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const result = await pool.query(sql, [account_email])
    return result.rows[0]
  } catch (error) {
    console.error("Error in getAccountByEmail:", error)
    return null
  }
}

/* *****************************
* Return account data using account_id
* ***************************** */
async function getAccountById(account_id) {
  try {
    const sql = "SELECT * FROM account WHERE account_id = $1"
    const result = await pool.query(sql, [account_id])
    return result.rows[0]
  } catch (error) {
    console.error("Error in getAccountById:", error)
    return null
  }
}

/* *****************************
* Update account information
* ***************************** */
async function updateAccount(account_id, account_firstname, account_lastname, account_email, account_phone = null) {
  try {
    const sql = "UPDATE account SET account_firstname = $1, account_lastname = $2, account_email = $3, account_phone = $4 WHERE account_id = $5 RETURNING *"
    const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_phone, account_id])
    return result.rowCount > 0
  } catch (error) {
    console.error("Error in updateAccount:", error)
    return false
  }
}

/* *****************************
* Update account password
* ***************************** */
async function updatePassword(account_id, account_password) {
  try {
    const sql = "UPDATE account SET account_password = $1 WHERE account_id = $2 RETURNING *"
    const result = await pool.query(sql, [account_password, account_id])
    return result.rowCount > 0
  } catch (error) {
    console.error("Error in updatePassword:", error)
    return false
  }
}

/* *****************************
* Get user's bookings
* ***************************** */
async function getAccountBookings(account_id) {
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
    console.error("Error in getAccountBookings:", error)
    return []
  }
}

module.exports = {
  registerAccount,
  checkExistingEmail,
  getAccountByEmail,
  getAccountById,
  updateAccount,
  updatePassword,
  getAccountBookings
}