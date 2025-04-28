const utilities = require("../utilities")
const accountModel = require("../models/account-model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const jwtHelpers = require('../utilities/jwt-helpers')

/* ****************************************
*  Deliver login view
* *************************************** */
async function buildLogin(req, res, next) {
  let nav = await utilities.getNav()
  const messages = req.flash("notice")
  
  // Check for redirect parameter
  const redirect = req.query.redirect || "/account/"
  
  res.render("account/login", {
    title: "Login",
    nav,
    errors: null,
    messages,
    redirect
  })
}

/* ****************************************
*  Process login with JWT
* *************************************** */
async function accountLoginAPI(req, res) {
    const { account_email, account_password } = req.body;
    
    try {
      const accountData = await accountModel.getAccountByEmail(account_email);
      
      if (!accountData) {
        return res.status(400).json({
          success: false,
          message: "Invalid credentials"
        });
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(account_password, accountData.account_password);
      
      if (passwordMatch) {
        // Remove the password before sending data
        delete accountData.account_password;
        
        // Generate JWT token
        const token = jwtHelpers.generateToken(accountData);
        
        res.json({
          success: true,
          token,
          account: accountData
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Invalid credentials"
        });
      }
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Server error during login"
      });
    }
  }
  
  /* ****************************************
  *  Process login
  * *************************************** */
  async function accountLogin(req, res) {
    let nav = await utilities.getNav()
    const { account_email, account_password, redirect } = req.body
    
    try {
      const accountData = await accountModel.getAccountByEmail(account_email)
      
      if (!accountData) {
        req.flash("notice", "Please check your credentials and try again.")
        res.status(400).render("account/login", {
          title: "Login",
          nav,
          errors: null,
          messages: req.flash("notice"),
          account_email,
          redirect
        })
        return
      }
      
      // Check password
      const passwordMatch = await bcrypt.compare(account_password, accountData.account_password)
      
      if (passwordMatch) {
        // Remove the password before storing in JWT
        delete accountData.account_password
        
        // Create JWT
        const accessToken = jwt.sign(
          accountData, 
          process.env.ACCESS_TOKEN_SECRET, 
          { expiresIn: 3600 }
        )
        
        // Set cookie
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
        
        // Redirect to specified path or account management
        return res.redirect(redirect || "/account/")
      } else {
        req.flash("notice", "Please check your credentials and try again.")
        res.status(400).render("account/login", {
          title: "Login",
          nav,
          errors: null,
          messages: req.flash("notice"),
          account_email,
          redirect
        })
      }
    } catch (error) {
      console.error("Login error:", error)
      req.flash("notice", "An error occurred during login. Please try again later.")
      res.status(500).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        messages: req.flash("notice"),
        account_email,
        redirect
      })
    }
  }
  
  /* ****************************************
  *  Process logout
  * *************************************** */
  async function accountLogout(req, res, next) {
    res.clearCookie("jwt");
    req.flash("notice", "You have been logged out.");
    return res.redirect("/");
  }
  
  /* ****************************************
  *  Deliver registration view
  * *************************************** */
  async function buildRegister(req, res, next) {
    let nav = await utilities.getNav()
    const messages = req.flash("notice")
    
    res.render("account/register", {
      title: "Register",
      nav,
      errors: null,
      messages,
    })
  }
  
  /* ****************************************
  *  Process Registration
  * *************************************** */
  async function registerAccount(req, res) {
    let nav = await utilities.getNav()
    const { 
      account_firstname, 
      account_lastname, 
      account_email, 
      account_password,
      account_phone
    } = req.body
  
    // Hash the password before storing
    let hashedPassword
    try {
      // regular password and cost (salt is generated automatically)
      hashedPassword = await bcrypt.hashSync(account_password, 10)
    } catch (error) {
      req.flash("notice", 'Sorry, there was an error processing the registration.')
      res.status(500).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
        messages: req.flash("notice"),
      })
    }
  
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword,
      account_phone
    )
  
    if (regResult) {
      req.flash(
        "notice",
        `Congratulations, you're registered ${account_firstname}. Please log in.`
      )
      res.status(201).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        messages: req.flash("notice"),
      })
    } else {
      req.flash("notice", "Sorry, the registration failed.")
      res.status(501).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
        messages: req.flash("notice"),
      })
    }
  }
  
  /* ****************************************
  *  Deliver account management view
  * *************************************** */
  async function buildAccountManagement(req, res, next) {
    let nav = await utilities.getNav()
    const messages = req.flash("notice")
    
    // Get account type from the request (will be added by authorization middleware)
    const account_type = res.locals.accountData.account_type
    const account_firstname = res.locals.accountData.account_firstname
    const account_id = res.locals.accountData.account_id
    
    // Get account bookings
    const bookings = await accountModel.getAccountBookings(account_id)
    
    res.render("account/management", {
      title: "Account Management",
      nav,
      errors: null,
      messages,
      account_type,
      account_firstname,
      account_id,
      bookings,
      utilities
    })
  }
  
  /* ****************************************
  *  Deliver account update view
  * *************************************** */
  async function buildAccountUpdate(req, res, next) {
    let nav = await utilities.getNav()
    const account_id = parseInt(req.params.account_id)
    
    // Check if the account_id in the URL matches the logged-in user's account_id
    if (account_id !== res.locals.accountData.account_id) {
      req.flash("notice", "You can only update your own account.")
      return res.redirect("/account/")
    }
    
    // Get account data from model
    const accountData = await accountModel.getAccountById(account_id)
    
    if (!accountData) {
      req.flash("notice", "Account not found.")
      return res.redirect("/account/")
    }
    
    const messages = req.flash("notice")
    
    res.render("account/update", {
      title: "Update Account",
      nav,
      errors: null,
      messages,
      account_id: accountData.account_id,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
      account_phone: accountData.account_phone || "",
    })
  }
  
  /* ****************************************
  *  Process account update
  * *************************************** */
  async function updateAccount(req, res, next) {
    let nav = await utilities.getNav()
    const { 
      account_id, 
      account_firstname, 
      account_lastname, 
      account_email,
      account_phone
    } = req.body
    
    // Check if the account_id in the form matches the logged-in user's account_id
    if (parseInt(account_id) !== res.locals.accountData.account_id) {
      req.flash("notice", "You can only update your own account.")
      return res.redirect("/account/")
    }
    
    const updateResult = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email,
      account_phone
    )
    
    if (updateResult) {
      // Get updated account data
      const accountData = await accountModel.getAccountById(account_id)
      
      // Update JWT token with new account data
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 })
      res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      
      req.flash("notice", "Account updated successfully.")
      return res.redirect("/account/")
    } else {
      req.flash("notice", "Update failed. Please try again.")
      res.status(501).render("account/update", {
        title: "Update Account",
        nav,
        errors: null,
        messages: req.flash("notice"),
        account_id,
        account_firstname,
        account_lastname,
        account_email,
        account_phone,
      })
    }
  }
  
  /* ****************************************
  *  Process password update
  * *************************************** */
  async function updatePassword(req, res, next) {
    let nav = await utilities.getNav()
    const { account_id, account_password } = req.body
    
    // Check if the account_id in the form matches the logged-in user's account_id
    if (parseInt(account_id) !== res.locals.accountData.account_id) {
      req.flash("notice", "You can only update your own account.")
      return res.redirect("/account/")
    }
    
    // Hash the new password
    let hashedPassword
    try {
      hashedPassword = await bcrypt.hashSync(account_password, 10)
    } catch (error) {
      req.flash("notice", "An error occurred while processing your request. Please try again.")
      return res.redirect(`/account/update/${account_id}`)
    }
    
    const updateResult = await accountModel.updatePassword(account_id, hashedPassword)
    
    if (updateResult) {
      req.flash("notice", "Password updated successfully.")
      return res.redirect("/account/")
    } else {
      req.flash("notice", "Password update failed. Please try again.")
      return res.redirect(`/account/update/${account_id}`)
    }
  }
  
  module.exports = { 
    buildLogin, 
    buildRegister, 
    registerAccount, 
    accountLogin, 
    accountLoginAPI,
    buildAccountManagement, 
    buildAccountUpdate, 
    updateAccount, 
    updatePassword, 
    accountLogout
  }