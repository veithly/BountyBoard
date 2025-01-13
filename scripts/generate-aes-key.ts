const cryptoNode = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generate encryption key and configuration
 */
function generateEncryptionConfig() {
  // Generate a 32-byte (256-bit) random key
  const key = cryptoNode.randomBytes(32);

  const config = {
    NEXT_PUBLIC_ENCRYPTION_KEY: key.toString('base64')
  };

  // Create environment variable file content
  const envContent = Object.entries(config)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');

  // Write configuration to .env file
  const envPath = path.join(process.cwd(), '.env');

  // If the file exists, read the existing content first.
  let existingContent = '';
  try {
    existingContent = fs.readFileSync(envPath, 'utf8');
  } catch (error) {
    // File does not exist, ignore the error.
  }

  // Update or add new configuration
  const envLines = existingContent.split('\n');
  const newEnvLines = envLines.filter(line =>
    !line.startsWith('NEXT_PUBLIC_ENCRYPTION_KEY=')
  );
  newEnvLines.push(envContent);

  // Write updated content
  fs.writeFileSync(envPath, newEnvLines.join('\n'));

  console.log('Encryption key generated and saved to .env file');
  console.log('Please ensure to securely store these values elsewhere as a backup');
  console.log('\nGenerated configuration:');
  console.log('NEXT_PUBLIC_ENCRYPTION_KEY:', config.NEXT_PUBLIC_ENCRYPTION_KEY);
}

// Run the generator
generateEncryptionConfig();