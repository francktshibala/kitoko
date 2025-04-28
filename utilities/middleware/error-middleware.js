/* ******************************
 * Error handling middleware
 * ***************************** */
const errorHandler = (err, req, res, next) => {
    const error = {
      status: err.status || 500,
      message: err.message || 'Server Error'
    }
    console.error(`Error: ${error.message}`)
    
    if (error.status == 404) {
      res.status(404).render("errors/error404", {
        title: 'Page Not Found',
        message: 'Sorry, we couldn\'t find the requested page.',
        nav: req.nav,
        errors: null,
        messages: null
      })
      return
    }
    
    // For all other errors (including intentional 500)
    res.status(error.status).render("errors/error500", {
      title: 'Server Error',
      message: 'Something went wrong on our side. Please try again later.',
      nav: req.nav,
      errors: null,
      messages: null
    })
  }
  
  module.exports = errorHandler