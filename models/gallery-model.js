const pool = require("../database/")

/* ***************************
 *  Get all gallery images
 * ************************** */
async function getAllImages() {
  try {
    const sql = `
      SELECT g.*, s.service_name, c.category_name
      FROM gallery g
      LEFT JOIN service s ON g.service_id = s.service_id
      LEFT JOIN service_category c ON s.category_id = c.category_id
      ORDER BY g.upload_date DESC
    `
    const result = await pool.query(sql)
    return result.rows
  } catch (error) {
    console.error("Error in getAllImages:", error)
    return []
  }
}

/* ***************************
 *  Get gallery images by service ID
 * ************************** */
async function getImagesByService(service_id) {
  try {
    const sql = `
      SELECT g.*, s.service_name
      FROM gallery g
      JOIN service s ON g.service_id = s.service_id
      WHERE g.service_id = $1
      ORDER BY g.upload_date DESC
    `
    const result = await pool.query(sql, [service_id])
    return result.rows
  } catch (error) {
    console.error("Error in getImagesByService:", error)
    return []
  }
}

/* ***************************
 *  Get gallery images by category ID
 * ************************** */
async function getImagesByCategory(category_id) {
  try {
    const sql = `
      SELECT g.*, s.service_name, c.category_name
      FROM gallery g
      JOIN service s ON g.service_id = s.service_id
      JOIN service_category c ON s.category_id = c.category_id
      WHERE c.category_id = $1
      ORDER BY g.upload_date DESC
    `
    const result = await pool.query(sql, [category_id])
    return result.rows
  } catch (error) {
    console.error("Error in getImagesByCategory:", error)
    return []
  }
}

/* ***************************
 *  Get featured gallery images
 * ************************** */
async function getFeaturedImages(limit = 8) {
  try {
    const sql = `
      SELECT g.*, s.service_name
      FROM gallery g
      JOIN service s ON g.service_id = s.service_id
      WHERE g.is_featured = TRUE
      ORDER BY g.upload_date DESC
      LIMIT $1
    `
    const result = await pool.query(sql, [limit])
    return result.rows
  } catch (error) {
    console.error("Error in getFeaturedImages:", error)
    return []
  }
}

/* ***************************
 *  Get single gallery image by ID
 * ************************** */
async function getImageById(gallery_id) {
  try {
    const sql = `
      SELECT g.*, s.service_name, c.category_name
      FROM gallery g
      LEFT JOIN service s ON g.service_id = s.service_id
      LEFT JOIN service_category c ON s.category_id = c.category_id
      WHERE g.gallery_id = $1
    `
    const result = await pool.query(sql, [gallery_id])
    return result.rows[0]
  } catch (error) {
    console.error("Error in getImageById:", error)
    return null
  }
}

/* ***************************
 *  Add new gallery image
 * ************************** */
async function addImage(service_id, image_path, image_title, image_description = null, is_featured = false) {
  try {
    const sql = `
      INSERT INTO gallery (
        service_id,
        image_path,
        image_title,
        image_description,
        is_featured
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const result = await pool.query(sql, [
      service_id,
      image_path,
      image_title,
      image_description,
      is_featured
    ])
    return result.rows[0]
  } catch (error) {
    console.error("Error in addImage:", error)
    throw error
  }
}

/* ***************************
 *  Update gallery image
 * ************************** */
async function updateImage(gallery_id, service_id, image_title, image_description, is_featured) {
  try {
    const sql = `
      UPDATE gallery
      SET service_id = $1,
          image_title = $2,
          image_description = $3,
          is_featured = $4
      WHERE gallery_id = $5
      RETURNING *
    `
    const result = await pool.query(sql, [
      service_id,
      image_title,
      image_description,
      is_featured,
      gallery_id
    ])
    return result.rows[0]
  } catch (error) {
    console.error("Error in updateImage:", error)
    throw error
  }
}

/* ***************************
 *  Delete gallery image
 * ************************** */
async function deleteImage(gallery_id) {
  try {
    const sql = "DELETE FROM gallery WHERE gallery_id = $1"
    const result = await pool.query(sql, [gallery_id])
    return result.rowCount > 0
  } catch (error) {
    console.error("Error in deleteImage:", error)
    throw error
  }
}

/* ***************************
 *  Toggle featured status
 * ************************** */
async function toggleFeatured(gallery_id, featured_status) {
  try {
    const sql = `
      UPDATE gallery
      SET is_featured = $1
      WHERE gallery_id = $2
      RETURNING *
    `
    const result = await pool.query(sql, [featured_status, gallery_id])
    return result.rows[0]
  } catch (error) {
    console.error("Error in toggleFeatured:", error)
    throw error
  }
}

module.exports = {
  getAllImages,
  getImagesByService,
  getImagesByCategory,
  getFeaturedImages,
  getImageById,
  addImage,
  updateImage,
  deleteImage,
  toggleFeatured
}