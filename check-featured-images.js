/**
 * Check Featured Images Script
 * 
 * This script checks which existing images are marked as featured
 * and allows you to mark more images as featured if needed.
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

async function checkFeaturedImages() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Get count of all featured images
    const featuredCountResult = await client.query('SELECT COUNT(*) FROM gallery WHERE is_featured = TRUE');
    const featuredCount = parseInt(featuredCountResult.rows[0].count);
    
    console.log(`\nFeatured images count: ${featuredCount}`);
    
    // Get all gallery records that have existing files
    const existingImagesQuery = `
      SELECT g.gallery_id, g.image_path, g.image_title, g.is_featured, s.service_name
      FROM gallery g
      JOIN service s ON g.service_id = s.service_id
      ORDER BY g.gallery_id
    `;
    
    const result = await client.query(existingImagesQuery);
    console.log(`Found ${result.rows.length} total gallery records`);
    
    // Filter only those that have existing files
    const existingImages = [];
    for (const record of result.rows) {
      const imagePath = path.join('./public', record.image_path);
      
      if (fs.existsSync(imagePath)) {
        existingImages.push(record);
      }
    }
    
    console.log(`Found ${existingImages.length} gallery records with existing image files`);
    
    if (existingImages.length === 0) {
      console.log('No existing images found! Please upload some images first.');
      return;
    }
    
    // Show featured status
    console.log('\nExisting images and their featured status:');
    existingImages.forEach(image => {
      console.log(`Gallery ID ${image.gallery_id}: "${image.image_title}" (${image.service_name})`);
      console.log(`  Featured: ${image.is_featured ? '✅ Yes' : '❌ No'}`);
      console.log(`  Path: ${image.image_path}`);
    });
    
    // If no featured images, suggest making some featured
    if (featuredCount === 0) {
      console.log('\n❌ You have no featured images! The "Our Work" section on the homepage will be empty.');
      
      // Confirm making some images featured
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      readline.question('\nWould you like to mark some images as featured? (yes/no): ', async (answer) => {
        if (answer.toLowerCase() === 'yes') {
          // Mark first 4 existing images as featured
          const imageIdsToFeature = existingImages.slice(0, 4).map(img => img.gallery_id);
          
          if (imageIdsToFeature.length === 0) {
            console.log('No images available to feature.');
            readline.close();
            client.release();
            await pool.end();
            return;
          }
          
          const updateQuery = `UPDATE gallery SET is_featured = TRUE WHERE gallery_id IN (${imageIdsToFeature.join(',')})`;
          const updateResult = await client.query(updateQuery);
          
          console.log(`✅ Successfully marked ${updateResult.rowCount} images as featured.`);
          console.log('The "Our Work" section on the homepage should now display these images.');
        } else {
          console.log('Operation cancelled.');
        }
        
        readline.close();
        client.release();
        await pool.end();
      });
    } else {
      console.log(`\n✅ You have ${featuredCount} featured images. The "Our Work" section should display them.`);
      console.log('If the images still don\'t appear, try restarting your application.');
      client.release();
      await pool.end();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (client) client.release();
    await pool.end();
  }
}

// Run the script
checkFeaturedImages()
  .catch(err => console.error('Script error:', err));