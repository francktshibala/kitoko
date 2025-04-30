/**
 * Test Sharp.js Installation
 * 
 * This script tests if Sharp.js is installed and working correctly.
 * Run with: node test-sharp.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

console.log('Testing Sharp.js installation...');
console.log('Sharp version:', sharp.versions);

// Create test directories if they don't exist
const testDir = path.join('./test-sharp');
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create a simple test image
const testImage = Buffer.from(
  '<svg width="300" height="200"><rect width="300" height="200" fill="red"/></svg>'
);

async function testSharp() {
  try {
    // Test basic resize operation
    console.log('Testing basic resize functionality...');
    const output = await sharp(testImage)
      .resize(150, 100)
      .jpeg()
      .toBuffer();
    
    console.log('✅ Resize test successful! Output size:', output.length, 'bytes');
    
    // Write test file to disk
    const outputPath = path.join(testDir, 'test-output.jpg');
    await sharp(testImage)
      .resize(150, 100)
      .jpeg()
      .toFile(outputPath);
    
    console.log('✅ File write test successful! Output file:', outputPath);
    
    // Test thumbnail creation
    const thumbnailPath = path.join(testDir, 'test-thumbnail.jpg');
    await sharp(testImage)
      .resize(50, 50, { fit: 'cover' })
      .jpeg({ quality: 70 })
      .toFile(thumbnailPath);
    
    console.log('✅ Thumbnail test successful! Output file:', thumbnailPath);
    
    console.log('All Sharp.js tests passed! Your installation appears to be working correctly.');
  } catch (error) {
    console.error('❌ Sharp.js test failed:', error);
    console.log('\nPossible solutions:');
    console.log('1. Reinstall Sharp: npm install sharp@latest');
    console.log('2. Check for platform-specific issues: https://sharp.pixelplumbing.com/install');
    console.log('3. If on Linux, ensure you have required dependencies: apt-get install -y libvips-dev');
  }
}

testSharp();