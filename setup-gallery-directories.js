/**
 * Create Gallery Directories Script
 * Run this script to create the necessary directories for the gallery feature
 */

const fs = require('fs');
const path = require('path');

console.log('Creating necessary directories for gallery uploads...');

// Define paths
const uploadsDir = path.join('./public/images/uploads');
const galleryDir = path.join('./public/images/gallery');
const thumbnailsDir = path.join('./public/images/gallery/thumbnails');

// Create directories if they don't exist
const createDirIfNotExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dirPath}`);
    } catch (error) {
      console.error(`❌ Error creating directory ${dirPath}:`, error);
    }
  } else {
    console.log(`✓ Directory already exists: ${dirPath}`);
  }
};

// Create each directory
createDirIfNotExists(uploadsDir);
createDirIfNotExists(galleryDir);
createDirIfNotExists(thumbnailsDir);

// Check permissions (on Windows, this will be skipped)
if (process.platform !== 'win32') {
  try {
    const testDir = fs.openSync(`${galleryDir}/test.txt`, 'w');
    fs.writeSync(testDir, 'Test file for permissions check');
    fs.closeSync(testDir);
    fs.unlinkSync(`${galleryDir}/test.txt`);
    console.log('✅ Directory permissions are correct (write test successful)');
  } catch (error) {
    console.error('❌ Permission issue with gallery directory:', error);
    console.log('💡 Try running: chmod -R 755 ./public/images');
  }
} else {
  // On Windows, just check if we can write a test file
  try {
    const testFile = path.join(galleryDir, 'test.txt');
    fs.writeFileSync(testFile, 'Test file for permissions check');
    fs.unlinkSync(testFile);
    console.log('✅ Directory permissions are correct (write test successful)');
  } catch (error) {
    console.error('❌ Permission issue with gallery directory:', error);
    console.log('💡 Make sure your user account has write permissions to these folders');
  }
}

console.log('Done! Now try uploading images again.');