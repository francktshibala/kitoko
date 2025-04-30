const pool = require("../database/")

/* ***************************
 *  Get all service categories
 * ************************** */
async function getCategories() {
  try {
    return await pool.query(
      "SELECT * FROM public.service_category ORDER BY category_name"
    )
  } catch (error) {
    console.error("getCategories error: " + error)
    throw error
  }
}

/* ***************************
 *  Check if category exists
 * ************************** */
async function checkExistingCategory(category_name) {
  try {
    const sql = "SELECT * FROM public.service_category WHERE category_name = $1"
    const data = await pool.query(sql, [category_name])
    return data.rowCount > 0
  } catch (error) {
    console.error("Error checking for existing category:", error)
    throw error
  }
}

/* ***************************
 *  Add new category
 * ************************** */
async function addCategory(category_name, category_description, category_image) {
  try {
    const sql = `
      INSERT INTO public.service_category (
        category_name, 
        category_description, 
        category_image
      ) 
      VALUES ($1, $2, $3) 
      RETURNING *
    `
    const data = await pool.query(sql, [
      category_name, 
      category_description,
      category_image
    ])
    return data.rows[0]
  } catch (error) {
    console.error("Error adding category:", error)
    throw error
  }
}

/* ***************************
 *  Get services by category ID
 * ************************** */
async function getServicesByCategoryId(category_id) {
  try {
    const data = await pool.query(
      `SELECT s.*, c.category_name 
       FROM public.service AS s
       JOIN public.service_category AS c 
       ON s.category_id = c.category_id 
       WHERE s.category_id = $1
       ORDER BY s.service_name`,
      [category_id]
    )
    return data.rows
  } catch (error) {
    console.error("getServicesByCategoryId error: " + error)
    throw error
  }
}

/* ***************************
 *  Get service details by ID
 * ************************** */
async function getServiceById(service_id) {
  try {
    const data = await pool.query(
      `SELECT s.*, c.category_name 
       FROM public.service AS s
       JOIN public.service_category AS c 
       ON s.category_id = c.category_id 
       WHERE s.service_id = $1`,
      [service_id]
    )
    return data.rows[0]
  } catch (error) {
    console.error("getServiceById error: " + error)
    throw error
  }
}

/* ***************************
 *  Get service options by service ID
 * ************************** */
async function getServiceOptions(service_id) {
  try {
    const data = await pool.query(
      `SELECT * 
       FROM public.service_option 
       WHERE service_id = $1
       ORDER BY option_name`,
      [service_id]
    )
    return data.rows
  } catch (error) {
    console.error("getServiceOptions error: " + error)
    throw error
  }
}

/* ***************************
 *  Add new service
 * ************************** */
async function addService(
  category_id,
  service_name,
  service_description,
  service_price,
  service_image,
  service_thumbnail,
  min_guests,
  max_guests
) {
  try {
    const sql = `
      INSERT INTO public.service (
        category_id,
        service_name,
        service_description,
        service_price,
        service_image,
        service_thumbnail,
        min_guests,
        max_guests
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
      RETURNING *
    `
    const data = await pool.query(sql, [
      category_id,
      service_name,
      service_description,
      service_price,
      service_image,
      service_thumbnail,
      min_guests,
      max_guests
    ])
    return data.rows[0]
  } catch (error) {
    console.error("Error adding service:", error)
    throw error
  }
}

/* ***************************
 *  Get featured services for homepage
 * ************************** */
async function getFeaturedServices() {
  try {
    const data = await pool.query(
      `SELECT s.*, c.category_name 
       FROM public.service AS s
       JOIN public.service_category AS c 
       ON s.category_id = c.category_id 
       ORDER BY RANDOM()
       LIMIT 3`
    )
    return data.rows
  } catch (error) {
    console.error("getFeaturedServices error: " + error)
    throw error
  }
}

/* ***************************
 *  Get testimonials for homepage
 * ************************** */
async function getTestimonials() {
  try {
    const data = await pool.query(
      `SELECT r.*, s.service_name, a.account_firstname, a.account_lastname
       FROM public.review AS r
       JOIN public.service AS s ON r.service_id = s.service_id
       JOIN public.account AS a ON r.account_id = a.account_id
       WHERE r.review_rating >= 4
       ORDER BY RANDOM()
       LIMIT 3`
    )
    return data.rows
  } catch (error) {
    console.error("getTestimonials error: " + error)
    return [] // Return empty array to prevent homepage error
  }
}

/* ***************************
 *  Get featured gallery images for homepage
 * ************************** */
async function getFeaturedGalleryImages() {
  try {
    const data = await pool.query(
      `SELECT g.*, s.service_name
       FROM public.gallery AS g
       JOIN public.service AS s ON g.service_id = s.service_id
       WHERE g.is_featured = TRUE
       ORDER BY RANDOM()
       LIMIT 4`
    )
    return data.rows
  } catch (error) {
    console.error("getFeaturedGalleryImages error: " + error)
    return [] // Return empty array to prevent homepage error
  }
}

/* ***************************
 *  Get service option by ID
 * ************************** */
async function getServiceOptionById(option_id) {
  try {
    const data = await pool.query(
      `SELECT * 
       FROM public.service_option 
       WHERE option_id = $1`,
      [option_id]
    )
    return data.rows[0]
  } catch (error) {
    console.error("getServiceOptionById error: " + error)
    return null
  }
}

/* ***************************
 *  Get all services
 * ************************** */
async function getAllServices() {
  try {
    const data = await pool.query(
      `SELECT s.*, c.category_name 
       FROM public.service AS s
       JOIN public.service_category AS c 
       ON s.category_id = c.category_id 
       ORDER BY s.service_name`
    )
    return data.rows
  } catch (error) {
    console.error("getAllServices error: " + error)
    return []
  }
}

// Add this function to the module.exports object in your existing service-model.js file
// module.exports = {
//   ...existing exports,
//   getServiceOptionById
// }
module.exports = {
  getCategories,
  checkExistingCategory,
  addCategory,
  getServicesByCategoryId,
  getServiceById,
  getServiceOptions,
  addService,
  getFeaturedServices,
  getTestimonials,
  getFeaturedGalleryImages,
  getServiceOptionById,
  getAllServices
}