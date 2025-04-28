const utilities = require("../utilities/")
const serviceModel = require("../models/service-model")
const baseController = {}

baseController.buildHome = async function(req, res){
  try {
    const nav = await utilities.getNav()
    
    // Get featured services
    const featuredServices = await serviceModel.getFeaturedServices()
    
    // Get testimonials (reviews)
    const testimonials = await serviceModel.getTestimonials()
    
    // Get featured gallery images
    const galleryImages = await serviceModel.getFeaturedGalleryImages()
    
    res.render("index", {
      title: "Home", 
      nav,
      featuredServices: featuredServices || [],
      testimonials: testimonials || [],
      galleryImages: galleryImages || [],
      utilities
    })
  } catch (error) {
    console.error("Error in buildHome:", error)
    res.render("index", {
      title: "Home", 
      nav: await utilities.getNav(),
      featuredServices: [],
      testimonials: [],
      galleryImages: [],
      utilities
    })
  }
}

module.exports = baseController