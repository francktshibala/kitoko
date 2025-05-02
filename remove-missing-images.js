/**
 * Remove Missing Image Records Script
 * 
 * This script removes records from the gallery table that don't have 
 * corresponding image files in the file system.
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

async function removeMissingImageRecords() {
  let client;
  
  try {
    console.log('Connecting to database...');
    client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Get all gallery records
    const result = await client.query('SELECT gallery_id, image_path, image_title FROM gallery');
    console.log(`Found ${result.rows.length} gallery records`);
    
    if (result.rows.length === 0) {
      console.log('No gallery records found.');
      return;
    }
    
    console.log('\nChecking for missing image files:');
    let recordsToDelete = [];
    
    // Check each image file
    for (const record of result.rows) {
      const imagePath = path.join('./public', record.image_path);
      
      if (!fs.existsSync(imagePath)) {
        console.log(`❌ Missing image: Gallery ID ${record.gallery_id}: "${record.image_title}"`);
        console.log(`  Path: ${imagePath}`);
        recordsToDelete.push(record.gallery_id);
      }
    }
    
    if (recordsToDelete.length === 0) {
      console.log('No missing images found!');
      return;
    }
    
    console.log(`\nFound ${recordsToDelete.length} records with missing images.`);
    console.log('Gallery IDs to delete:', recordsToDelete.join(', '));
    
    // Confirm deletion
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    readline.question(`\nDo you want to delete these ${recordsToDelete.length} records? (yes/no): `, async (answer) => {
      if (answer.toLowerCase() === 'yes') {
        // Delete records
        const deleteQuery = `DELETE FROM gallery WHERE gallery_id IN (${recordsToDelete.join(',')})`;
        const deleteResult = await client.query(deleteQuery);
        
        console.log(`✅ Successfully deleted ${deleteResult.rowCount} records.`);
      } else {
        console.log('Operation cancelled.');
      }
      
      readline.close();
      client.release();
      await pool.end();
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
    if (client) client.release();
    await pool.end();
  }
}

// Run the script
removeMissingImageRecords()
  .catch(err => console.error('Script error:', err));