/**
 * Check Gallery Database Tables
 * 
 * This script checks if the gallery table exists and creates it if it doesn't.
 * Run with: node check-gallery-db.js
 */

require('dotenv').config();
const { Pool } = require('pg');

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false
  }
});

async function checkGalleryTable() {
  let client;
  
  try {
    console.log('Connecting to database...');
    
    // Connect to the database
    client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Check if gallery table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gallery'
      );
    `);
    
    const tableExists = tableCheck.rows[0].exists;
    
    if (tableExists) {
      console.log('✅ Gallery table exists');
      
      // Count records in gallery table
      const countResult = await client.query('SELECT COUNT(*) FROM gallery');
      console.log(`Gallery table has ${countResult.rows[0].count} records`);
      
      // Check table structure
      console.log('Checking gallery table structure...');
      const columnsResult = await client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'gallery';
      `);
      
      console.log('Gallery table columns:');
      columnsResult.rows.forEach(row => {
        console.log(`- ${row.column_name} (${row.data_type})`);
      });
      
    } else {
      console.log('❌ Gallery table does not exist. Creating it now...');
      
      // Create gallery table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.gallery (
          gallery_id SERIAL PRIMARY KEY,
          service_id INTEGER REFERENCES public.service(service_id) ON DELETE CASCADE,
          image_path VARCHAR(255) NOT NULL,
          image_title VARCHAR(100),
          image_description TEXT,
          is_featured BOOLEAN DEFAULT FALSE,
          upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      console.log('✅ Gallery table created successfully');
    }
    
    // Test insert and select
    console.log('\nTesting database operations...');
    
    // Insert test record
    const insertResult = await client.query(`
      INSERT INTO gallery (service_id, image_path, image_title, is_featured) 
      VALUES (
        (SELECT service_id FROM service LIMIT 1), 
        '/images/gallery/test-image.jpg', 
        'Test Image', 
        false
      )
      RETURNING gallery_id;
    `);
    
    const testId = insertResult.rows[0].gallery_id;
    console.log(`✅ Test record inserted with ID: ${testId}`);
    
    // Select the test record
    const selectResult = await client.query(`
      SELECT * FROM gallery WHERE gallery_id = $1;
    `, [testId]);
    
    console.log('✅ Test record retrieved successfully');
    
    // Delete the test record
    await client.query(`
      DELETE FROM gallery WHERE gallery_id = $1;
    `, [testId]);
    
    console.log('✅ Test record deleted successfully');
    console.log('\nAll database tests passed. Your gallery table is working correctly.');
    
  } catch (error) {
    console.error('❌ Database error:', error);
    console.log('\nPossible solutions:');
    console.log('1. Check your CONNECTION_STRING in .env file');
    console.log('2. Make sure your database exists and is accessible');
    console.log('3. Check if the service table exists (required for foreign key)');
    console.log('4. Run the init-database.js script to initialize the database');
  } finally {
    // Release the client back to the pool
    if (client) {
      client.release();
    }
    // Close the pool
    await pool.end();
  }
}

// Run the script
checkGalleryTable()
  .then(() => {
    console.log('Database check completed');
  })
  .catch((error) => {
    console.error('Script error:', error);
  });