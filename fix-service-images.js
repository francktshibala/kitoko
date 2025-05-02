/**
 * Fix Service Images Script
 * 
 * This script fixes service image paths in the database
 * to point to default images if the files don't exist.
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

// Default image paths by category
const DEFAULT_IMAGES = {
  'Wedding Decoration': {
    image: '/images/services/wedding-default.jpg',
    thumbnail: '/images/services/wedding-default-tn.jpg'
  },
  'Corporate Events': {
    image: '/images/services/corporate-default.jpg',
    thumbnail: '/images/services/corporate-default-tn.jpg'
  },
  'Catering Services': {
    image: '/images/services/catering-default.jpg',
    thumbnail: '/images/services/catering-default-tn.jpg'
  },
  'Birthday Parties': {
    image: '/images/services/birthday-default.jpg',
    thumbnail: '/images/services/birthday-default-tn.jpg'
  },
  'Anniversary Celebrations': {
    image: '/images/services/anniversary-default.jpg',
    thumbnail: '/images/services/anniversary-default-tn.jpg'
  },
  'default': {
    image: '/images/services/default.jpg',
    thumbnail: '/images/services/default-tn.jpg'
  }
};

// Make sure default image directories exist
function ensureDefaultDirectories() {
  const dir = './public/images/services';
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
}

// Create default images if they don't exist
async function createDefaultImages() {
  const sharp = require('sharp');
  
  // Ensure the directory exists
  ensureDefaultDirectories();
  
  // Colors for different categories
  const colors = {
    'Wedding Decoration': '#f8d7da', // Light pink
    'Corporate Events': '#d1ecf1', // Light blue
    'Catering Services': '#d4edda', // Light green
    'Birthday Parties': '#fff3cd', // Light yellow
    'Anniversary Celebrations': '#e2e3e5', // Light gray
    'default': '#f8f9fa' // Light white
  };
  
  // Create each default image
  for (const category in DEFAULT_IMAGES) {
    const mainImagePath = path.join('./public', DEFAULT_IMAGES[category].image);
    const thumbnailPath = path.join('./public', DEFAULT_IMAGES[category].thumbnail);
    
    // Create main image if it doesn't exist
    if (!fs.existsSync(mainImagePath)) {
      console.log(`Creating default image for ${category}...`);
      
      try {
        await sharp({
          create: {
            width: 1200,
            height: 800,
            channels: 4,
            background: colors[category] || colors['default']
          }
        })
        .composite([{
          input: Buffer.from(`<svg width="1200" height="800">
            <text x="50%" y="50%" font-family="Arial" font-size="48" fill="#333" text-anchor="middle">${category}</text>
          </svg>`),
          top: 0,
          left: 0
        }])
        .jpeg()
        .toFile(mainImagePath);
        
        console.log(`✅ Created default image: ${mainImagePath}`);
      } catch (error) {
        console.error(`❌ Error creating default image ${mainImagePath}:`, error.message);
      }
    }
    
    // Create thumbnail if it doesn't exist
    if (!fs.existsSync(thumbnailPath)) {
      console.log(`Creating default thumbnail for ${category}...`);
      
      try {
        await sharp({
          create: {
            width: 400,
            height: 300,
            channels: 4,
            background: colors[category] || colors['default']
          }
        })
        .composite([{
          input: Buffer.from(`<svg width="400" height="300">
            <text x="50%" y="50%" font-family="Arial" font-size="24" fill="#333" text-anchor="middle">${category}</text>
          </svg>`),
          top: 0,
          left: 0
        }])
        .jpeg()
        .toFile(thumbnailPath);
        
        console.log(`✅ Created default thumbnail: ${thumbnailPath}`);
      } catch (error) {
        console.error(`❌ Error creating default thumbnail ${thumbnailPath}:`, error.message);
      }
    }
  }
}

async function fixServiceImages() {
  let client;
  
  try {
    // Create default images first
    await createDefaultImages();
    
    console.log('\nConnecting to database...');
    client = await pool.connect();
    console.log('Successfully connected to the database');
    
    // Begin transaction
    await client.query('BEGIN');
    
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
      await client.query('COMMIT');
      return;
    }
    
    let updatedImages = 0;
    
    // Check and update each service
    for (const service of result.rows) {
      let needsUpdate = false;
      let newMainImage = service.service_image;
      let newThumbnail = service.service_thumbnail;
      
      // Check main image
      if (service.service_image) {
        const imagePath = path.join('./public', service.service_image);
        if (!fs.existsSync(imagePath)) {
          // Use default image for this category
          const categoryDefaults = DEFAULT_IMAGES[service.category_name] || DEFAULT_IMAGES['default'];
          newMainImage = categoryDefaults.image;
          needsUpdate = true;
        }
      } else {
        // No image specified, use default
        const categoryDefaults = DEFAULT_IMAGES[service.category_name] || DEFAULT_IMAGES['default'];
        newMainImage = categoryDefaults.image;
        needsUpdate = true;
      }
      
      // Check thumbnail
      if (service.service_thumbnail) {
        const thumbnailPath = path.join('./public', service.service_thumbnail);
        if (!fs.existsSync(thumbnailPath)) {
          // Use default thumbnail for this category
          const categoryDefaults = DEFAULT_IMAGES[service.category_name] || DEFAULT_IMAGES['default'];
          newThumbnail = categoryDefaults.thumbnail;
          needsUpdate = true;
        }
      } else {
        // No thumbnail specified, use default
        const categoryDefaults = DEFAULT_IMAGES[service.category_name] || DEFAULT_IMAGES['default'];
        newThumbnail = categoryDefaults.thumbnail;
        needsUpdate = true;
      }
      
      // Update service if needed
      if (needsUpdate) {
        console.log(`\nUpdating Service ID ${service.service_id}: "${service.service_name}"`);
        
        if (newMainImage !== service.service_image) {
          console.log(`  Main image: ${service.service_image || 'none'} -> ${newMainImage}`);
        }
        
        if (newThumbnail !== service.service_thumbnail) {
          console.log(`  Thumbnail: ${service.service_thumbnail || 'none'} -> ${newThumbnail}`);
        }
        
        // Update database
        await client.query(`
          UPDATE service 
          SET service_image = $1, service_thumbnail = $2
          WHERE service_id = $3
        `, [newMainImage, newThumbnail, service.service_id]);
        
        updatedImages++;
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Summary
    console.log('\nSummary:');
    console.log(`Total service records: ${result.rows.length}`);
    console.log(`Updated services: ${updatedImages}`);
    
    if (updatedImages > 0) {
      console.log('\n✅ Service images have been fixed!');
      console.log('The services section should now display all images properly.');
      console.log('Please restart your application to see the changes.');
    } else {
      console.log('\n✅ No updates needed. All service images are already valid.');
    }
    
  } catch (error) {
    // Rollback in case of error
    if (client) {
      await client.query('ROLLBACK');
    }
    console.error('\n❌ Error:', error);
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

// Run the script
fixServiceImages()
  .catch(err => console.error('Script error:', err));