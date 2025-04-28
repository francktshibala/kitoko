const express = require('express');
const router = express.Router();
const accountController = require('../../controllers/accountController');
const utilities = require('../../utilities');
const jwtUtils = require('../../utilities/jwt-helpers');

// Middleware to check JWT token
const checkJWT = (req, res, next) => {
  // Get token from authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'No token provided' 
    });
  }
  
  // Verify token
  const decoded = jwtUtils.verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ 
      success: false,
      message: 'Invalid token' 
    });
  }
  
  // Attach user to request object
  req.user = decoded;
  next();
};

// Login route
router.post('/login', accountController.accountLoginAPI);

// Register route
router.post('/register', async (req, res) => {
  try {
    // Extract registration data
    const { account_firstname, account_lastname, account_email, account_password, account_phone } = req.body;
    
    // Check if email already exists
    const emailExists = await accountController.checkExistingEmail(account_email);
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'Email already exists'
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(account_password, 10);
    
    // Register account
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword,
      account_phone
    );
    
    if (regResult) {
      return res.status(201).json({
        success: true,
        message: 'Registration successful'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Registration failed'
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// Get account data (protected route)
router.get('/profile', checkJWT, async (req, res) => {
  try {
    const accountData = await accountModel.getAccountById(req.user.account_id);
    
    if (!accountData) {
      return res.status(404).json({
        success: false,
        message: 'Account not found'
      });
    }
    
    // Remove password before sending
    delete accountData.account_password;
    
    res.json({
      success: true,
      account: accountData
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching profile'
    });
  }
});

// Update account (protected route)
router.put('/profile', checkJWT, async (req, res) => {
  try {
    const { account_firstname, account_lastname, account_email, account_phone } = req.body;
    const account_id = req.user.account_id;
    
    // Check if email exists and isn't the user's current email
    const currentAccount = await accountModel.getAccountById(account_id);
    if (account_email !== currentAccount.account_email) {
      const emailExists = await accountModel.checkExistingEmail(account_email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }
    
    // Update account
    const updateResult = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      account_phone
    );
    
    if (updateResult) {
      // Get updated account data
      const updatedAccount = await accountModel.getAccountById(account_id);
      
      // Remove password before sending
      delete updatedAccount.account_password;
      
      // Generate new token with updated data
      const token = jwtUtils.generateToken(updatedAccount);
      
      return res.json({
        success: true,
        message: 'Account updated successfully',
        account: updatedAccount,
        token
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Update failed'
      });
    }
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating account'
    });
  }
});

// Update password (protected route)
router.put('/password', checkJWT, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const account_id = req.user.account_id;
    
    // Get current account data
    const accountData = await accountModel.getAccountById(account_id);
    
    // Verify current password
    const passwordMatch = await bcrypt.compare(current_password, accountData.account_password);
    if (!passwordMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);
    
    // Update password
    const updateResult = await accountModel.updatePassword(account_id, hashedPassword);
    
    if (updateResult) {
      return res.json({
        success: true,
        message: 'Password updated successfully'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Password update failed'
      });
    }
  } catch (error) {
    console.error('Password update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating password'
    });
  }
});

module.exports = router;