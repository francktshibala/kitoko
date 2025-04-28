const express = require("express")
const router = new express.Router()
const serviceController = require("../controllers/serviceController")
const utilities = require("../utilities")
const categoryValidate = require("../utilities/category-validation")
const serviceValidate = require("../utilities/service-validation")

// Route to build services by category view
router.get("/category/:categoryId", utilities.handleErrors(serviceController.buildByCategory))

// Route to build service detail view
router.get("/detail/:serviceId", utilities.handleErrors(serviceController.buildByServiceId))

// Route to build services management view - requires employee or admin
router.get(
  "/management", 
  utilities.checkAccountType,
  utilities.handleErrors(serviceController.buildManagementView)
)

// Route to build add category view - requires employee or admin
router.get(
  "/add-category", 
  utilities.checkAccountType,
  utilities.handleErrors(serviceController.buildAddCategory)
)

// Route to process add category - requires employee or admin
router.post(
  "/add-category", 
  utilities.checkAccountType,
  categoryValidate.categoryRules(),
  categoryValidate.checkCategoryData,
  utilities.handleErrors(serviceController.addCategory)
)

// Route to build add service view - requires employee or admin
router.get(
  "/add-service", 
  utilities.checkAccountType,
  utilities.handleErrors(serviceController.buildAddService)
)

// Route to process add service - requires employee or admin
router.post(
  "/add-service",
  utilities.checkAccountType,
  serviceValidate.serviceRules(),
  serviceValidate.checkServiceData,
  utilities.handleErrors(serviceController.addService)
)

module.exports = router