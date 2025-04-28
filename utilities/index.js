const serviceModel = require("../models/service-model")
const jwt = require("jsonwebtoken")
require("dotenv").config()
const Util = {}

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function (req, res, next) {
  try {
    let data = await serviceModel.getCategories()
    let list = "<ul>"
    list += '<li><a href="/" title="Home page">Home</a></li>'
    data.rows.forEach((row) => {
      list += "<li>"
      list +=
        '<a href="/services/category/' +
        row.category_id +
        '" title="See our ' +
        row.category_name +
        ' services">' +
        row.category_name +
        "</a>"
      list += "</li>"
    })
    list += '<li><a href="/gallery" title="View our gallery">Gallery</a></li>'
    list += '<li><a href="/contact" title="Contact us">Contact</a></li>'
    list += "</ul>"
    return list
  } catch (error) {
    console.error("Error building navigation:", error)
    return "<ul><li><a href='/' title='Home page'>Home</a></li></ul>"
  }
}

/* ****************************************
* Middleware For Handling Errors
* Wrap other function in this for 
* General Error Handling
**************************************** */
Util.handleErrors = (fn) => (req, res, next) => 
  Promise.resolve(fn(req, res, next)).catch(next)

/* ****************************************
* JWT Token processing middleware
**************************************** */
Util.checkJWTToken = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          console.error("JWT Verification Error:", err)
          req.flash("notice", "Please log in")
          res.clearCookie("jwt")
          return res.redirect("/account/login")
        }
        res.locals.accountData = accountData
        res.locals.loggedin = 1
        next()
      }
    )
  } else {
    res.locals.loggedin = 0
    next()
  }
}

/* ****************************************
*  Check Login
* ************************************ */
Util.checkLogin = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          console.error("JWT Verification Error in checkLogin:", err)
          req.flash("notice", "Please log in")
          res.clearCookie("jwt")
          return res.redirect("/account/login")
        }
        res.locals.accountData = accountData
        res.locals.loggedin = 1
        next()
      }
    )
  } else {
    req.flash("notice", "Please log in")
    return res.redirect("/account/login")
  }
}

/* ****************************************
*  Check Account Type (Admin/Employee access only)
* ************************************ */
Util.checkAccountType = (req, res, next) => {
  if (req.cookies.jwt) {
    jwt.verify(
      req.cookies.jwt,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          console.error("JWT Verification Error in checkAccountType:", err)
          req.flash("notice", "Please log in")
          res.clearCookie("jwt")
          return res.redirect("/account/login")
        }
        
        if (accountData.account_type === 'Employee' || accountData.account_type === 'Admin') {
          res.locals.accountData = accountData
          res.locals.loggedin = 1
          next()
        } else {
          req.flash("notice", "You do not have permissions to access this page")
          return res.redirect("/account/")
        }
      }
    )
  } else {
    req.flash("notice", "Please log in")
    return res.redirect("/account/login")
  }
}

/* **************************************
* Check if Category exists
* ************************************ */
Util.checkExistingCategory = async (category_name) => {
  try {
    return await serviceModel.checkExistingCategory(category_name)
  } catch (error) {
    console.error("Error checking category:", error)
    return false
  }
}

/* **************************************
* Format price to currency
* ************************************ */
Util.formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 2 
  }).format(amount)
}

/* **************************************
* Format date to readable format
* ************************************ */
Util.formatDate = (dateString) => {
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  return new Date(dateString).toLocaleDateString('en-US', options)
}

module.exports = Util