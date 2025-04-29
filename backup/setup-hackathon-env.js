/**
 * CHEQD Hackathon Environment Setup Script
 * 
 * This script helps you create a .env file with proper configuration for the hackathon.
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

// Sample test mnemonic for CHEQD testnet
const SAMPLE_MNEMONIC = 'erosion soda nest butter sudden pear rocket ordinary gentle rhythm setup toilet swear raise nasty cactus razor strategy memory system turtle eight web banner pull';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Paths
const ENV_PATH = path.join(__dirname, '.env');
const EXAMPLE_ENV_PATH = path.join(__dirname, 'config.example.env');

// Check if .env already exists
if (fs.existsSync(ENV_PATH)) {
  console.log('An .env file already exists. Do you want to overwrite it? (yes/no)');
  rl.question('', (answer) => {
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      createEnvFile();
    } else {
      console.log('Setup aborted. Your current .env file was not modified.');
      rl.close();
    }
  });
} else {
  createEnvFile();
}

function createEnvFile() {
  console.log('\n=== CHEQD Hackathon Environment Setup ===\n');
  
  // Read the example config if it exists
  let templateContent;
  try {
    templateContent = fs.readFileSync(EXAMPLE_ENV_PATH, 'utf8');
  } catch (error) {
    // Create a basic template if the example doesn't exist
    templateContent = `# Telegram Bot Token
TOKEN=your_bot_token_here

# cheqd Network Configuration
CHEQD_NETWORK=testnet
CHEQD_RPC_URL=https://rpc.cheqd.network
CHEQD_MNEMONIC=your_mnemonic_here

# GunDB Configuration
GUNDB_PEERS=https://gun-peer.example.com/gun

# Express Server (if needed)
PORT=3000`;
  }

  console.log('Do you want to use the sample test mnemonic for the hackathon? (yes/no)');
  console.log('Sample mnemonic:');
  console.log(SAMPLE_MNEMONIC);
  console.log('\nWARNING: This is for TESTING only. Do not use with real funds!');
  
  rl.question('', (answer) => {
    let envContent = templateContent;
    
    if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
      // Replace the mnemonic placeholder with the sample mnemonic
      envContent = envContent.replace('CHEQD_MNEMONIC=your_mnemonic_here', `CHEQD_MNEMONIC=${SAMPLE_MNEMONIC}`);
      console.log('\nUsing the sample test mnemonic.');
    } else {
      console.log('\nPlease enter your CHEQD mnemonic (or press Enter to keep the placeholder):');
      rl.question('', (mnemonic) => {
        if (mnemonic.trim() !== '') {
          envContent = envContent.replace('CHEQD_MNEMONIC=your_mnemonic_here', `CHEQD_MNEMONIC=${mnemonic.trim()}`);
          console.log('Using your provided mnemonic.');
        } else {
          console.log('Keeping the mnemonic placeholder. Remember to update it before running the application!');
        }
        
        writeEnvFileAndExit(envContent);
      });
      return;
    }
    
    writeEnvFileAndExit(envContent);
  });
}

function writeEnvFileAndExit(content) {
  // Write the new .env file
  fs.writeFileSync(ENV_PATH, content);
  
  console.log('\n✅ Environment file created successfully!\n');
  console.log('Next steps:');
  console.log('1. If you kept the placeholder for any values, edit the .env file manually.');
  console.log('2. Test your setup by running: node test-veramo-did.js');
  console.log('3. If everything works, you can start the application with: node index-with-cheqd.js');
  
  rl.close();
}

rl.on('close', () => {
  process.exit(0);
}); 