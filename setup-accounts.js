/**
 * Account Setup Script for EventElegance
 * 
 * This script adds test accounts to the database for testing login functionality.
 * It includes an admin, an employee, and a client account.
 */

require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function createTestAccounts() {
  try {
    // Create admin account
    await createAccount(
      'Admin',
      'User',
      'admin@example.com',
      'Admin123!',
      '123-456-7890',
      'Admin'
    );

    // Create employee account
    await createAccount(
      'Employee',
      'User',
      'employee@example.com',
      'Employee123!',
      '123-456-7891',
      'Employee'
    );

    // Create client account
    await createAccount(
      'Client',
      'User',
      'client@example.com',
      'Client123!',
      '123-456-7892',
      'Client'
    );

    console.log('Test accounts created successfully!');
  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

async function createAccount(firstname, lastname, email, password, phone, type) {
  try {
    // Check if account already exists
    const checkSql = 'SELECT * FROM account WHERE account_email = $1';
    const checkResult = await pool.query(checkSql, [email]);
    
    if (checkResult.rowCount > 0) {
      console.log(`Account with email ${email} already exists, skipping...`);
      return;
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert the account
    const sql = `
      INSERT INTO account (
        account_firstname, 
        account_lastname, 
        account_email, 
        account_password,
        account_phone,
        account_type
      ) 
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const result = await pool.query(sql, [
      firstname,
      lastname,
      email,
      hashedPassword,
      phone,
      type
    ]);
    
    console.log(`Created ${type} account: ${email}`);
    return result.rows[0];
  } catch (error) {
    console.error(`Error creating ${type} account:`, error);
    throw error;
  }
}

// Run the script
createTestAccounts();