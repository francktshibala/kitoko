/**
 * Database initialization script for Kitoko application
 * This script creates necessary tables and adds sample data
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

async function initializeDatabase() {
  let client;
  
  try {
    // Connect to the database
    client = await pool.connect();
    console.log('Connected to the database');
    
    // Start a transaction
    await client.query('BEGIN');
    
    // Check and create account_type enum if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'account_type') THEN
          CREATE TYPE public.account_type AS ENUM ('Client', 'Employee', 'Admin');
        END IF;
      END$$;
    `);
    console.log('Account type enum checked/created');
    
    // Create account table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.account (
        account_id SERIAL PRIMARY KEY,
        account_firstname VARCHAR(50) NOT NULL,
        account_lastname VARCHAR(50) NOT NULL,
        account_email VARCHAR(100) NOT NULL UNIQUE,
        account_password VARCHAR(255) NOT NULL,
        account_phone VARCHAR(15),
        account_type account_type NOT NULL DEFAULT 'Client'::account_type,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Account table checked/created');
    
    // Create service categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.service_category (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(50) NOT NULL UNIQUE,
        category_description TEXT,
        category_image VARCHAR(255)
      );
    `);
    console.log('Service category table checked/created');
    
    // Create services table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.service (
        service_id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES public.service_category(category_id),
        service_name VARCHAR(100) NOT NULL,
        service_description TEXT NOT NULL,
        service_price NUMERIC(10, 2) NOT NULL,
        service_image VARCHAR(255),
        service_thumbnail VARCHAR(255),
        min_guests INTEGER DEFAULT 0,
        max_guests INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Service table checked/created');
    
    // Insert sample categories if they don't exist
    await client.query(`
      INSERT INTO public.service_category (category_name, category_description, category_image) 
      SELECT 'Wedding Decoration', 'Beautiful decoration services for your special day', '/images/categories/wedding-decor.jpg'
      WHERE NOT EXISTS (SELECT 1 FROM public.service_category WHERE category_name = 'Wedding Decoration');
    `);
    
    await client.query(`
      INSERT INTO public.service_category (category_name, category_description, category_image) 
      SELECT 'Corporate Events', 'Professional decoration for corporate gatherings', '/images/categories/corporate-events.jpg'
      WHERE NOT EXISTS (SELECT 1 FROM public.service_category WHERE category_name = 'Corporate Events');
    `);
    
    await client.query(`
      INSERT INTO public.service_category (category_name, category_description, category_image) 
      SELECT 'Catering Services', 'Delicious food options for all types of events', '/images/categories/catering.jpg'
      WHERE NOT EXISTS (SELECT 1 FROM public.service_category WHERE category_name = 'Catering Services');
    `);
    console.log('Sample categories inserted');
    
    // Get category IDs for sample services
    const weddingCategoryResult = await client.query(`
      SELECT category_id FROM public.service_category WHERE category_name = 'Wedding Decoration'
    `);
    
    const corporateCategoryResult = await client.query(`
      SELECT category_id FROM public.service_category WHERE category_name = 'Corporate Events'
    `);
    
    // Insert sample services if they don't exist
    if (weddingCategoryResult.rows.length > 0) {
      const weddingCategoryId = weddingCategoryResult.rows[0].category_id;
      
      await client.query(`
        INSERT INTO public.service (category_id, service_name, service_description, service_price, service_image, service_thumbnail, min_guests, max_guests)
        SELECT 
          $1,
          'Premium Wedding Package',
          'Our premium wedding decoration package includes elegant tablescapes, floral arrangements, lighting, and custom backdrop for your ceremony and reception.',
          1999.99,
          '/images/services/wedding-premium.jpg',
          '/images/services/wedding-premium-tn.jpg',
          50,
          200
        WHERE NOT EXISTS (SELECT 1 FROM public.service WHERE service_name = 'Premium Wedding Package');
      `, [weddingCategoryId]);
    }
    
    if (corporateCategoryResult.rows.length > 0) {
      const corporateCategoryId = corporateCategoryResult.rows[0].category_id;
      
      await client.query(`
        INSERT INTO public.service (category_id, service_name, service_description, service_price, service_image, service_thumbnail, min_guests, max_guests)
        SELECT 
          $1,
          'Executive Conference Setup',
          'Professional setup for corporate conferences including stage decoration, branded backdrops, seating arrangements, and technological support.',
          1499.99,
          '/images/services/corporate-conference.jpg',
          '/images/services/corporate-conference-tn.jpg',
          20,
          100
        WHERE NOT EXISTS (SELECT 1 FROM public.service WHERE service_name = 'Executive Conference Setup');
      `, [corporateCategoryId]);
    }
    console.log('Sample services inserted');
    
    // Create service options table
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.service_option (
        option_id SERIAL PRIMARY KEY,
        service_id INTEGER REFERENCES public.service(service_id) ON DELETE CASCADE,
        option_name VARCHAR(100) NOT NULL,
        option_description TEXT,
        option_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
        is_default BOOLEAN DEFAULT FALSE
      );
    `);
    console.log('Service option table checked/created');
    
    // Commit the transaction
    await client.query('COMMIT');
    console.log('Database initialization completed successfully');
    
  } catch (error) {
    // Rollback the transaction in case of error
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('Error initializing database:', error);
    throw error;
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
initializeDatabase()
  .then(() => {
    console.log('Database initialization script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });