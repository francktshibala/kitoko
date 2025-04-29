const { Pool } = require('pg');
require('dotenv').config();

console.log('Testing connection with:', process.env.CONNECTION_STRING);

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Connection error:', err);
  } else {
    console.log('Connection successful! Current time:', res.rows[0].now);
  }
  pool.end();
});