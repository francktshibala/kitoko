const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Generate a JWT token for a user
 * @param {Object} accountData - User account data
 * @returns {String} JWT token
 */
function generateToken(accountData) {
  const data = {
    account_id: accountData.account_id,
    account_email: accountData.account_email,
    account_type: accountData.account_type,
    account_firstname: accountData.account_firstname
  }
  
  return jwt.sign(
    data, 
    process.env.JWT_SECRET, 
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

/**
 * Verify a JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object|null} Decoded token or null if invalid
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

module.exports = {
  generateToken,
  verifyToken
}