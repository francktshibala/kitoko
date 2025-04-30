/**
 * Enhanced Error Handling Middleware
 * 
 * Replace your current error-middleware.js with this enhanced version
 */

/* ******************************
 * Error handling middleware
 * ***************************** */
const errorHandler = (err, req, res, next) => {
  // Detailed logging of the error
  console.error('🔴 ERROR DETAILS:');
  console.error('Path:', req.path);
  console.error('Method:', req.method);
  console.error('Status:', err.status || 500);
  console.error('Message:', err.message || 'Unknown error');
  
  // If it's a detailed error with a stack trace, log it
  if (err.stack) {
    console.error('Stack trace:', err.stack);
  }
  
  // If it has query parameters, log them
  if (Object.keys(req.query).length > 0) {
    console.error('Query params:', req.query);
  }
  
  // If it has body parameters, log them (but remove sensitive data)
  if (req.body && Object.keys(req.body).length > 0) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields for security
    if (sanitizedBody.account_password) sanitizedBody.account_password = '[REDACTED]';
    console.error('Body params:', sanitizedBody);
  }
  
  // Log any file uploads that might be part of the request
  if (req.file) {
    console.error('Uploaded file:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
  }
  
  // Create a user-friendly error object
  const error = {
    status: err.status || 500,
    message: err.message || 'Server Error'
  };
  console.error(`Error: ${error.message}`);
  
  // Handle 404 errors
  if (error.status == 404) {
    res.status(404).render("errors/error404", {
      title: 'Page Not Found',
      message: 'Sorry, we couldn\'t find the requested page.',
      nav: req.nav,
      errors: null,
      messages: null
    });
    return;
  }
  
  // For development mode, show more details
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // For all other errors (including intentional 500)
  res.status(error.status).render("errors/error500", {
    title: 'Server Error',
    message: isDevelopment ? `Error: ${error.message}` : 'Something went wrong on our side. Please try again later.',
    details: isDevelopment ? err.stack : null,
    nav: req.nav,
    errors: null,
    messages: null
  });
};

module.exports = errorHandler;