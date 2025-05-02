/**
 * Fix Gallery Records Script
 * 
 * This script automatically removes records from the gallery table
 * that don't have corresponding image files.
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

async function fixGalleryRecords() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Get all gallery records
    const result = await client.query('SELECT gallery_id, image_path, image_title, is_featured FROM gallery');
    console.log(`Found ${result.rows.length} gallery records`);
    
    if (result.rows.length === 0) {
      console.log('No gallery records found.');
      return;
    }
    
    console.log('\nChecking for missing image files:');
    let recordsToDelete = [];
    let existingRecords = [];
    let featuredCount = 0;
    
    // Check each image file
    for (const record of result.rows) {
      const imagePath = path.join('./public', record.image_path);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`❌ Missing image: Gallery ID ${record.gallery_id}: "${record.image_title}"`);
        console.log(`  Path: ${imagePath}`);
        recordsToDelete.push(record.gallery_id);
      } else {
        console.log(`✅ Found image: Gallery ID ${record.gallery_id}: "${record.image_title}"`);
        existingRecords.push(record);
        if (record.is_featured) {
          featuredCount++;
        }
      }
    }
    
    if (recordsToDelete.length === 0) {
      console.log('No missing images found!');
      await client.query('COMMIT');
      return;
    }
    
    console.log(`\nFound ${recordsToDelete.length} records with missing images.`);
    console.log(`Found ${existingRecords.length} records with existing images.`);
    console.log(`Of those, ${featuredCount} are marked as featured.`);
    
    // Delete records with missing images
    const deleteQuery = `DELETE FROM gallery WHERE gallery_id IN (${recordsToDelete.join(',')})`;
    const deleteResult = await client.query(deleteQuery);
    
    console.log(`✅ Successfully deleted ${deleteResult.rowCount} records with missing images.`);
    
    // Check if we need to mark more images as featured
    if (featuredCount < 4 && existingRecords.length >= 4) {
      console.log('\nYou have fewer than 4 featured images. Marking some as featured...');
      
      let imagesToFeature = [];
      let featuredNeeded = 4 - featuredCount;
      
      // Find images that aren't yet featured
      const nonFeatured = existingRecords.filter(record => !record.is_featured);
      
      // Add them to the list until we have enough
      for (let i = 0; i < Math.min(featuredNeeded, nonFeatured.length); i++) {
        imagesToFeature.push(nonFeatured[i].gallery_id);
      }
      
      if (imagesToFeature.length > 0) {
        const updateQuery = `UPDATE gallery SET is_featured = TRUE WHERE gallery_id IN (${imagesToFeature.join(',')})`;
        const updateResult = await client.query(updateQuery);
        
        console.log(`✅ Successfully marked ${updateResult.rowCount} additional images as featured.`);
      }
    }
    
    // Commit the transaction
    await client.query('COMMIT');
    
    console.log('\n✅ Gallery records have been cleaned up!');
    console.log('The "Our Work" section on your homepage should now display properly.');
    console.log('Please restart your application to see the changes.');
    
  } catch (error) {
    // Rollback in case of error
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('❌ Error:', error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run the script
fixGalleryRecords()
  .catch(err => console.error('Script error:', err));