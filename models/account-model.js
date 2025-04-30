const pool = require("../database/")

/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail(email) {
  try {
    const result = await pool.query(
      'SELECT * FROM account WHERE account_email = $1',
      [email]
    )
    return result.rows[0]
  } catch (error) {
    console.error("getAccountByEmail error " + error)
    return null
  }
}

/* *****************************
* Return account data using account id
* ***************************** */
async function getAccountById(account_id) {
  try {
    const result = await pool.query(
      'SELECT * FROM account WHERE account_id = $1',
      [account_id]
    )
    return result.rows[0]
  } catch (error) {
    console.error("getAccountById error " + error)
    return null
  }
}

/* *****************************
* Check if an email exists in the database
* ***************************** */
async function checkExistingEmail(email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email_exists = await pool.query(sql, [email])
    return email_exists.rowCount > 0
  } catch (error) {
    console.error("Error checking for existing email", error)
    return false
  }
}

/* *****************************
* Register new account
* ***************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password, account_phone = null) {
  try {
    const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_phone) VALUES ($1, $2, $3, $4, $5) RETURNING *"
    const data = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_password,
      account_phone
    ])
    return data.rowCount > 0
  } catch (error) {
    console.error("Error registering account:", error)
    return false
  }
}

/* *****************************
* Update account information
* ***************************** */
async function updateAccount(account_id, account_firstname, account_lastname, account_email, account_phone) {
  try {
    const sql = "UPDATE account SET account_firstname = $1, account_lastname = $2, account_email = $3, account_phone = $4 WHERE account_id = $5 RETURNING *"
    const data = await pool.query(sql, [
      account_firstname,
      account_lastname,
      account_email,
      account_phone,
      account_id
    ])
    return data.rowCount > 0
  } catch (error) {
    console.error("Error updating account:", error)
    return false
  }
}

/* *****************************
* Update account password
* ***************************** */
async function updatePassword(account_id, account_password) {
  try {
    const sql = "UPDATE account SET account_password = $1 WHERE account_id = $2 RETURNING *"
    const data = await pool.query(sql, [
      account_password,
      account_id
    ])
    return data.rowCount > 0
  } catch (error) {
    console.error("Error updating password:", error)
    return false
  }
}

/* *****************************
* Get account bookings
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
    console.error("Error getting account bookings:", error)
    return []
  }
}

module.exports = {
  getAccountByEmail,
  getAccountById,
  checkExistingEmail,
  registerAccount,
  updateAccount,
  updatePassword,
  getAccountBookings
}