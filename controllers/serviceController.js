const utilities = require("../utilities")
const serviceModel = require("../models/service-model")
const serviceController = {}

/* ***************************
 *  Build services by category view
 * ************************** */
serviceController.buildByCategory = async function (req, res, next) {
  const category_id = req.params.categoryId
  const data = await serviceModel.getServicesByCategoryId(category_id)
  
  if (data.length > 0) {
    const categoryName = data[0].category_name
    const servicesGrid = await buildServicesGrid(data)
    let nav = await utilities.getNav()
    
    res.render("services/category", {
      title: categoryName + " Services",
      nav,
      servicesGrid,
      utilities,
      messages: null,
      errors: null
    })
  } else {
    let nav = await utilities.getNav()
    res.render("services/category", {
      title: "No Services Found",
      nav,
      servicesGrid: '<p class="notice">No services found in this category.</p>',
      utilities,
      messages: null,
      errors: null
    })
  }
}

/* ***************************
 *  Build service detail view
 * ************************** */
serviceController.buildByServiceId = async function (req, res, next) {
  try {
    const service_id = req.params.serviceId
    const serviceData = await serviceModel.getServiceById(service_id)
    
    if (!serviceData) {
      req.flash("notice", "Service not found.")
      return res.redirect("/services")
    }
    
    // Get service options
    const options = await serviceModel.getServiceOptions(service_id)
    
    // Get service gallery images
    // This will be implemented later in the gallery feature
    
    // Build the HTML for the service detail
    const serviceHTML = await buildServiceDetailHtml(serviceData, options)
    
    let nav = await utilities.getNav()
    const serviceName = serviceData.service_name
    
    res.render("services/detail", {
      title: serviceName,
      nav,
      serviceHTML,
      serviceData,
      options,
      utilities,
      messages: req.flash("notice"),
      errors: null,
      loggedin: res.locals.loggedin
    })
  } catch (error) {
    console.error("Error in buildByServiceId: ", error)
    next(error)
  }
}

/* ***************************
 *  Build services management view (admin)
 * ************************** */
serviceController.buildManagementView = async function (req, res, next) {
  try {
    let nav = await utilities.getNav()
    
    res.render("services/management", {
      title: "Services Management",
      nav,
      messages: req.flash("notice"),
      errors: null,
    })
  } catch (error) {
    console.error("Error in buildManagementView: ", error)
    next(error)
  }
}

/* ***************************
 *  Build add category view (admin)
 * ************************** */
serviceController.buildAddCategory = async function (req, res, next) {
  let nav = await utilities.getNav()
  
  res.render("services/add-category", {
    title: "Add New Category",
    nav,
    messages: req.flash("notice"),
    errors: null,
  })
}

/* ***************************
 *  Process add category (admin)
 * ************************** */
serviceController.addCategory = async function (req, res, next) {
  const { category_name, category_description, category_image } = req.body
  
  try {
    const result = await serviceModel.addCategory(
      category_name, 
      category_description, 
      category_image || '/images/categories/default.jpg'
    )
    
    if (result) {
      req.flash("notice", `The ${category_name} category was successfully added.`)
      // Generate a new navigation bar with the new category
      let nav = await utilities.getNav()
      return res.redirect("/services/management")
    } else {
      req.flash("notice", "Sorry, the addition failed.")
      let nav = await utilities.getNav()
      res.status(501).render("services/add-category", {
        title: "Add New Category",
        nav,
        messages: req.flash("notice"),
        errors: null,
      })
    }
  } catch (error) {
    console.error("Add category error:", error)
    req.flash("notice", "Sorry, there was an error processing the request.")
    let nav = await utilities.getNav()
    res.status(500).render("services/add-category", {
      title: "Add New Category",
      nav,
      messages: req.flash("notice"),
      errors: null,
    })
  }
}

/* ***************************
 *  Build add service view (admin)
 * ************************** */
serviceController.buildAddService = async function (req, res, next) {
  let nav = await utilities.getNav()
  let categorySelect = await buildCategorySelect()
  
  res.render("services/add-service", {
    title: "Add New Service",
    nav,
    categorySelect,
    messages: req.flash("notice"),
    errors: null,
  })
}

/* ***************************
 *  Process add service (admin)
 * ************************** */
serviceController.addService = async function (req, res, next) {
  let nav = await utilities.getNav()
  const {
    category_id,
    service_name,
    service_description,
    service_price,
    service_image,
    service_thumbnail,
    min_guests,
    max_guests
  } = req.body
  
  try {
    const serviceResult = await serviceModel.addService(
      category_id,
      service_name,
      service_description,
      service_price,
      service_image,
      service_thumbnail,
      min_guests || 0,
      max_guests || null
    )
    
    if (serviceResult) {
      req.flash("notice", `The ${service_name} service was successfully added.`)
      return res.redirect("/services/management")
    } else {
      req.flash("notice", "Sorry, the addition failed.")
      let categorySelect = await buildCategorySelect(category_id)
      res.status(501).render("services/add-service", {
        title: "Add New Service",
        nav,
        categorySelect,
        messages: req.flash("notice"),
        errors: null,
        category_id,
        service_name,
        service_description,
        service_price,
        service_image,
        service_thumbnail,
        min_guests,
        max_guests
      })
    }
  } catch (error) {
    console.error("Add service error:", error)
    req.flash("notice", "Sorry, there was an error processing the request.")
    let categorySelect = await buildCategorySelect(category_id)
    res.status(500).render("services/add-service", {
      title: "Add New Service",
      nav,
      categorySelect,
      messages: req.flash("notice"),
      errors: null,
      category_id,
      service_name,
      service_description,
      service_price,
      service_image,
      service_thumbnail,
      min_guests,
      max_guests
    })
  }
}

/* **************************************
* Build the services grid HTML
* ************************************ */
async function buildServicesGrid(data) {
  let grid = '<div class="services-grid">'
  
  // Check if there is data
  if (data && data.length > 0) {
    data.forEach(service => {
      grid += '<div class="service-card">'
      grid += `<a href="/services/detail/${service.service_id}" title="View ${service.service_name} details">`
      grid += `<img src="${service.service_thumbnail}" alt="Image of ${service.service_name}">`
      grid += '</a>'
      grid += '<div class="service-info">'
      grid += `<h2><a href="/services/detail/${service.service_id}">${service.service_name}</a></h2>`
      grid += `<p class="service-price">${utilities.formatCurrency(service.service_price)}</p>`
      grid += `<p class="service-guests">For ${service.min_guests || 0} to ${service.max_guests || '∞'} guests</p>`
      grid += `<a href="/services/detail/${service.service_id}" class="btn">View Details</a>`
      grid += '</div></div>'
    })
  } else {
    grid += '<p class="notice">No services available in this category.</p>'
  }
  
  grid += '</div>'
  return grid
}

/* **************************************
* Build the service detail HTML
* ************************************ */
async function buildServiceDetailHtml(service, options) {
  let html = '<div class="service-detail">'
  
  // Service image
  html += `<div class="service-detail-image">
    <img src="${service.service_image}" alt="${service.service_name}">
  </div>`
  
  // Service details
  html += '<div class="service-detail-info">'
  html += `<p class="service-category">Category: ${service.category_name}</p>`
  html += `<p class="service-price">Starting at: ${utilities.formatCurrency(service.service_price)}</p>`
  html += `<p class="service-guests">For ${service.min_guests || 0} to ${service.max_guests || 'unlimited'} guests</p>`
  html += '</div>'
  
  // Service description
  html += '<div class="service-detail-description">'
  html += `<h2>Description</h2>`
  html += `<p>${service.service_description}</p>`
  html += '</div>'
  
  // Service options
  if (options && options.length > 0) {
    html += '<div class="service-detail-options">'
    html += '<h2>Available Options</h2>'
    html += '<ul class="options-list">'
    
    options.forEach(option => {
      html += '<li class="option-item">'
      html += `<div class="option-name">${option.option_name}</div>`
      html += `<div class="option-description">${option.option_description}</div>`
      html += `<div class="option-price">Additional ${utilities.formatCurrency(option.option_price)}</div>`
      html += '</li>'
    })
    
    html += '</ul></div>'
  }
  
  // Booking button
  html += '<div class="service-detail-actions">'
  html += `<a href="/bookings/request/${service.service_id}" class="btn">Request Booking</a>`
  html += '</div>'
  
  html += '</div>' // Close service-detail
  
  return html
}

/* **************************************
* Build the category select dropdown
* ************************************ */
async function buildCategorySelect(selected_id = null) {
  let data = await serviceModel.getCategories()
  let select = '<select name="category_id" id="categorySelect" required>'
  select += '<option value="">Select a Category</option>'
  
  data.rows.forEach(row => {
    select += `<option value="${row.category_id}" ${selected_id == row.category_id ? 'selected' : ''}>${row.category_name}</option>`
  })
  
  select += '</select>'
  return select
}

module.exports = serviceController