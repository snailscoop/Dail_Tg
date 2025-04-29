/**
 * Simplified Hackathon Startup Script
 * 
 * This script starts both the GunDB server and the unified Telegram bot.
 */

const { spawn } = require('child_process');
const readline = require('readline');
const TelegramBot = require('node-telegram-bot-api');

// Try to load local environment
let token;
try {
  const localEnv = require('./local-env.js');
  token = localEnv.TOKEN;
} catch (error) {
  console.error('Error loading local-env.js:', error);
  process.exit(1);
}

// Set up readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configure color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Print banner
console.log(`
${colors.cyan}${colors.bright}=================================================
         UNIFIED TELEGRAM BOT STARTER
=================================================
${colors.reset}

${colors.yellow}This script will start the following services:
${colors.reset}
1. ${colors.green}GunDB Server${colors.reset} - For data storage
2. ${colors.green}Telegram Bot${colors.reset} - The unified bot with all features

${colors.yellow}Press Ctrl+C to stop all services${colors.reset}
`);

// Ask user to confirm
rl.question(`${colors.bright}Start services? (Y/n): ${colors.reset}`, (answer) => {
  const start = answer.toLowerCase() !== 'n';
  rl.close();
  
  if (start) {
    prepareAndStartServices();
  } else {
    console.log(`\n${colors.yellow}Startup cancelled.${colors.reset}`);
    process.exit(0);
  }
});

// Function to prepare by deleting webhook and then start services
async function prepareAndStartServices() {
  console.log(`\n${colors.yellow}Preparing services...${colors.reset}`);
  
  // Create bot instance for cleanup
  console.log(`${colors.blue}Deleting any existing webhook...${colors.reset}`);
  const cleanupBot = new TelegramBot(token, { polling: false });
  
  try {
    // Delete webhook to avoid conflicts with other bot instances
    await cleanupBot.deleteWebHook({ drop_pending_updates: true });
    console.log(`${colors.green}Webhook deleted successfully${colors.reset}`);
    
    // Start the actual services
    startServices();
  } catch (error) {
    console.error(`${colors.red}Error preparing bot: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Function to start services
function startServices() {
  console.log(`\n${colors.cyan}Starting services...${colors.reset}\n`);
  
  // Start GunDB server
  const gunServer = spawn('node', ['gun-server.js']);
  
  gunServer.stdout.on('data', (data) => {
    console.log(`${colors.blue}[GunDB] ${colors.reset}${data.toString().trim()}`);
  });
  
  gunServer.stderr.on('data', (data) => {
    console.error(`${colors.red}[GunDB Error] ${colors.reset}${data.toString().trim()}`);
  });
  
  // Wait for GunDB server to start before starting Telegram bot
  setTimeout(() => {
    console.log(`\n${colors.cyan}Starting Unified Telegram Bot...${colors.reset}\n`);
    
    // Set environment variable to use mock CHEQD for hackathon
    process.env.USE_MOCK_CHEQD = 'true';
    
    // Start Telegram bot
    const telegramBot = spawn('node', ['index.js']);
    
    telegramBot.stdout.on('data', (data) => {
      console.log(`${colors.green}[Bot] ${colors.reset}${data.toString().trim()}`);
    });
    
    telegramBot.stderr.on('data', (data) => {
      console.error(`${colors.red}[Bot Error] ${colors.reset}${data.toString().trim()}`);
    });
    
    telegramBot.on('close', (code) => {
      console.log(`\n${colors.yellow}Telegram Bot process exited with code ${code}${colors.reset}`);
      
      // If the bot exits, stop the GunDB server too
      gunServer.kill();
      process.exit(code);
    });
  }, 2000); // Wait 2 seconds for GunDB server to initialize
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Shutting down all services...${colors.reset}`);
    
    gunServer.kill();
    // The bot will be killed when the GunDB server exits
    
    setTimeout(() => {
      console.log(`\n${colors.green}All services stopped.${colors.reset}`);
      process.exit(0);
    }, 1000);
  });
} 