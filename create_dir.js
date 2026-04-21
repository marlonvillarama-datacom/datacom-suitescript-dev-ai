const fs = require('fs');
const path = require('path');

const targetPath = 'c:\\Users\\marlon.villarama\\OneDrive - Datacom\\Documents\\DEV\\LAB\\sc-ai-002\\src\\FileCabinet\\SuiteScripts\\Collections';

try {
  fs.mkdirSync(targetPath, { recursive: true });
  console.log('✓ Directory created successfully');
  console.log(`Path: ${targetPath}`);
  
  if (fs.existsSync(targetPath)) {
    console.log('✓ Directory verified - it exists');
  }
} catch (err) {
  console.error('Error creating directory:', err.message);
  process.exit(1);
}
