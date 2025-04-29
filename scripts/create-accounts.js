/**
 * Account Creation Script for EventElegance
 * 
 * This script demonstrates how to create different types of user accounts:
 * 1. Admin account - created directly in the database
 * 2. Client account - created directly in the database
 * 3. Public account - created through the registration process
 */

const { pool } = require('../database');
const bcrypt = require('bcryptjs');

// Function to create an admin account directly in the database
async function createAdminAccount(firstname, lastname, email, password, phone = null) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // SQL query to insert admin account
    const sql = `
      INSERT INTO account (
        account_firstname, 
        account_lastname, 
        account_email, 
        account_password,
        account_phone,
        account_type
      ) 
      VALUES ($1, $2, $3, $4, $5, 'Admin')
      RETURNING *
    `;
    
    // Execute query
    const result = await pool.query(sql, [
      firstname,
      lastname,
      email,
      hashedPassword,
      phone
    ]);
    
    console.log('Admin account created successfully:', {
      id: result.rows[0].account_id,
      email: result.rows[0].account_email,
      type: result.rows[0].account_type
    });
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating admin account:', error.message);
    throw error;
  }
}

// Function to create a client account directly in the database
async function createClientAccount(firstname, lastname, email, password, phone = null) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // SQL query to insert client account
    const sql = `
      INSERT INTO account (
        account_firstname, 
        account_lastname, 
        account_email, 
        account_password,
        account_phone,
        account_type
      ) 
      VALUES ($1, $2, $3, $4, $5, 'Client')
      RETURNING *
    `;
    
    // Execute query
    const result = await pool.query(sql, [
      firstname,
      lastname,
      email,
      hashedPassword,
      phone
    ]);
    
    console.log('Client account created successfully:', {
      id: result.rows[0].account_id,
      email: result.rows[0].account_email,
      type: result.rows[0].account_type
    });
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating client account:', error.message);
    throw error;
  }
}

// Function to create an employee account
async function createEmployeeAccount(firstname, lastname, email, password, phone = null) {
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // SQL query to insert employee account
    const sql = `
      INSERT INTO account (
        account_firstname, 
        account_lastname, 
        account_email, 
        account_password,
        account_phone,
        account_type
      ) 
      VALUES ($1, $2, $3, $4, $5, 'Employee')
      RETURNING *
    `;
    
    // Execute query
    const result = await pool.query(sql, [
      firstname,
      lastname,
      email,
      hashedPassword,
      phone
    ]);
    
    console.log('Employee account created successfully:', {
      id: result.rows[0].account_id,
      email: result.rows[0].account_email,
      type: result.rows[0].account_type
    });
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating employee account:', error.message);
    throw error;
  }
}

// Main function to create accounts
async function createAccounts() {
  try {
    // Create admin account
    await createAdminAccount(
      'New', 
      'Admin', 
      'newadmin@eventelegance.com', 
      'AdminPass123!', 
      '555-123-4567'
    );
    
    // Create employee account
    await createEmployeeAccount(
      'Staff', 
      'Member', 
      'staff@eventelegance.com', 
      'StaffPass123!', 
      '555-987-6543'
    );
    
    // Create client account
    await createClientAccount(
      'John', 
      'Customer', 
      'customer@example.com', 
      'Customer123!', 
      '555-555-5555'
    );
    
    console.log('All accounts created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Account creation failed:', error);
    process.exit(1);
  }
}

// Run the script
createAccounts();