/**
 * Clean Start Script for Telegram Bot
 * 
 * This script ensures a clean start by:
 * 1. Loading environment variables
 * 2. Removing any existing webhooks
 * 3. Starting the bot with proper polling settings
 */

// First, load environment variables from local-env.js
require('./local-env.js');
console.log('[Clean Start] Loaded environment variables');

// Import Telegram Bot API
const TelegramBot = require('node-telegram-bot-api');
const token = process.env.TOKEN;

if (!token) {
  console.error('[Clean Start] ERROR: No token found in environment variables');
  process.exit(1);
}

// Create bot instance without polling
console.log('[Clean Start] Creating bot instance...');
const bot = new TelegramBot(token, {
  polling: false,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
});

// Function to start the main bot process
const startBot = () => {
  console.log('[Clean Start] Starting the main bot process...');
  require('./index-with-cheqd.js');
};

// First, delete any active webhook and clean pending updates
console.log('[Clean Start] Removing any existing webhook...');
bot.deleteWebHook({ drop_pending_updates: true })
  .then(() => {
    console.log('[Clean Start] Webhook deleted successfully');
    
    // Get bot info to verify token is working
    return bot.getMe();
  })
  .then(botInfo => {
    console.log(`[Clean Start] Connected to Telegram as @${botInfo.username}`);
    
    // Disconnect this temporary bot instance
    bot.stopPolling();
    
    // Start the actual bot
    startBot();
  })
  .catch(error => {
    console.error('[Clean Start] Error during initialization:', error);
    process.exit(1);
  }); 