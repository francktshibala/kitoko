/**
 * Check Gallery Files Script
 * 
 * This script checks if the image files referenced in the gallery table
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

async function checkGalleryFiles() {
  let client;
  
  try {
    console.log('Connecting to database...');
    
    // Connect to the database
    client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Get all gallery records
    const result = await client.query('SELECT gallery_id, image_path, image_title FROM gallery');
    console.log(`Found ${result.rows.length} gallery records`);
    
    if (result.rows.length === 0) {
      console.log('No gallery records found.');
      return;
    }
    
    console.log('\nChecking if image files exist:');
    
    let missingMainImages = 0;
    let missingThumbnails = 0;
    let thumbnailDirExists = true;
    
    // Check each image file
    for (const record of result.rows) {
      // Main image path
      const imagePath = path.join('./public', record.image_path);
      
      // Thumbnail path
      const thumbnailDir = path.join(path.dirname('./public' + record.image_path), 'thumbnails');
      const thumbnailPath = path.join(thumbnailDir, path.basename(record.image_path));
      
      // Check if thumbnail directory exists
      if (!fs.existsSync(thumbnailDir)) {
        if (thumbnailDirExists) {  // Only print this message once
          console.log(`❌ Thumbnail directory does not exist: ${thumbnailDir}`);
          thumbnailDirExists = false;
        }
      }
      
      // Check main image
      const mainExists = fs.existsSync(imagePath);
      if (!mainExists) missingMainImages++;
      
      // Check thumbnail
      const thumbnailExists = fs.existsSync(thumbnailPath);
      if (!thumbnailExists) missingThumbnails++;
      
      console.log(`Gallery ID ${record.gallery_id}: "${record.image_title}"`);
      console.log(`  Main image (${record.image_path}): ${mainExists ? '✅ Exists' : '❌ Missing'}`);
      console.log(`  Thumbnail: ${thumbnailExists ? '✅ Exists' : '❌ Missing'}`);
    }
    
    // Summary
    console.log('\nSummary:');
    console.log(`Total gallery records: ${result.rows.length}`);
    console.log(`Missing main images: ${missingMainImages}`);
    console.log(`Missing thumbnails: ${missingThumbnails}`);
    
    if (missingMainImages > 0 || missingThumbnails > 0) {
      console.log('\nRecommendations:');
      
      if (!thumbnailDirExists) {
        console.log('1. Create the thumbnails directory:');
        console.log('   mkdir -p ./public/images/gallery/thumbnails');
      }
      
      console.log('2. You need to regenerate the missing images. You can:');
      console.log('   - Delete the gallery records with missing files and re-upload the images');
      console.log('   - Run a script to regenerate the images from a source directory');
      console.log('   - Use the setup-gallery-complete.js script which will generate sample images');
    } else {
      console.log('\n✅ All gallery images exist!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    // Release the client back to the pool
    if (client) client.release();
    
    // Close the pool
    await pool.end();
  }
}

// Run the script
checkGalleryFiles()
  .catch(err => console.error('Script error:', err));