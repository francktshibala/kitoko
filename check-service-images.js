/**
 * Check Service Images Script
 * 
 * This script checks if the image files referenced in the service table
 * actually exist in the file system.
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkServiceImages() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Get all service records with images
    const result = await client.query(`
      SELECT s.service_id, s.service_name, s.service_image, s.service_thumbnail,
             c.category_name 
      FROM service s
      JOIN service_category c ON s.category_id = c.category_id
      ORDER BY s.service_id
    `);
    
    console.log(`Found ${result.rows.length} service records`);
    
    if (result.rows.length === 0) {
      console.log('No service records found.');
      return;
    }
    
    console.log('\nChecking if service image files exist:');
    
    let missingMainImages = 0;
    let missingThumbnails = 0;
    
    // Check each image file
    for (const service of result.rows) {
      console.log(`\nService ID ${service.service_id}: "${service.service_name}" (${service.category_name})`);
      
      // Check main image
      let mainExists = false;
      if (service.service_image) {
        const imagePath = path.join('./public', service.service_image);
        mainExists = fs.existsSync(imagePath);
        console.log(`  Main image (${service.service_image}): ${mainExists ? '✅ Exists' : '❌ Missing'}`);
        if (!mainExists) missingMainImages++;
      } else {
        console.log(`  Main image: ⚠️ No path specified`);
      }
      
      // Check thumbnail
      let thumbnailExists = false;
      if (service.service_thumbnail) {
        const thumbnailPath = path.join('./public', service.service_thumbnail);
        thumbnailExists = fs.existsSync(thumbnailPath);
        console.log(`  Thumbnail (${service.service_thumbnail}): ${thumbnailExists ? '✅ Exists' : '❌ Missing'}`);
        if (!thumbnailExists) missingThumbnails++;
      } else {
        console.log(`  Thumbnail: ⚠️ No path specified`);
      }
    }
    
    // Summary
    console.log('\nSummary:');
    console.log(`Total service records: ${result.rows.length}`);
    console.log(`Missing main images: ${missingMainImages}`);
    console.log(`Missing thumbnails: ${missingThumbnails}`);
    
    if (missingMainImages > 0 || missingThumbnails > 0) {
      console.log('\nRecommendations:');
      console.log('1. Update the image paths in the database to point to existing images');
      console.log('2. Or, add the missing image files to the correct locations');
      console.log('3. Run the fix-service-images.js script to automatically fix the issues');
    } else {
      console.log('\n✅ All service images exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run the script
checkServiceImages()
  .catch(err => console.error('Script error:', err));