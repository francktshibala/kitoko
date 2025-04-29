const { Pool } = require("pg")
require("dotenv").config()

// Create a pool with configuration for remote Render database
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false // Required for Render PostgreSQL
  },
  // Add connection timeout
  connectionTimeoutMillis: 10000, // Increased for remote connection
  // Add idle timeout
  idleTimeoutMillis: 30000,
  // Maximum number of clients the pool should contain
  max: 20
})

// Test database connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection error:', err.message)
    console.error('Please check that:')
    console.error('1. Your CONNECTION_STRING in .env is correct')
    console.error('2. The database exists on Render')
    console.error('3. Network connectivity to Render is available')
  } else {
    console.log('Successfully connected to Render PostgreSQL database')
    release()
  }
})

// Added for troubleshooting queries during development
module.exports = {
  async query(text, params) {
    const start = Date.now()
    try {
      const res = await pool.query(text, params)
      const duration = Date.now() - start
      console.log('Executed query', { text, duration, rows: res.rowCount })
      return res
    } catch (error) {
      console.error('Error in query', { text })
      throw error
    }
  },
  pool
}