/* ******************************************
 * Primary file for EventElegance application
 *******************************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const env = require("dotenv").config();
const app = express();
const static = require("./routes/static");
const baseController = require("./controllers/baseController");
const utilities = require("./utilities");
const session = require("express-session");
const flash = require("express-flash");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const errorMiddleware = require("./utilities/middleware/error-middleware");
const apiRoutes = require('./api');
const cors = require('cors');
const path = require('path');

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.use(expressLayouts);
app.set("layout", "./layouts/layout"); // not at views root

/* ***********************
 * Middleware
 *************************/
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

// Cookie Parser
app.use(cookieParser());

// Express Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // Set to true if using https
}));

// Express Flash
app.use(flash());

// JWT Token processing
app.use(utilities.checkJWTToken);

// Pass nav to all views
app.use(async (req, res, next) => {
  // Add navigation to all views
  req.nav = await utilities.getNav(req);
  
  // Set res.locals.nav for EJS access
  res.locals.nav = req.nav;
  
  // Continue
  next();
});

/* ***********************
 * Routes
 *************************/
app.use(static);

// Index route
app.get("/", baseController.buildHome);

// Account routes
app.use("/account", require("./routes/accountRoute"));

// Service routes
app.use("/services", require("./routes/services"));

// API routes
app.use('/api', apiRoutes);

// Booking routes
app.use("/bookings", require("./routes/bookingRoutes"));

// Gallery routes
app.use("/gallery", require("./routes/galleryRoutes"));

// Message routes
app.use("/messages", require("./routes/messageRoutes"));
app.use("/contact", (req, res) => res.redirect("/messages/contact"));

// 404 route - must be after all other routes
app.use(async (req, res, next) => {
  next({status: 404, message: 'Sorry, we appear to have lost that page.'});
});

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(errorMiddleware);

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5500;
const host = process.env.HOST || 'localhost';

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`Kitoko app listening on ${host}:${port}`);
});