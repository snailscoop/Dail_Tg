/**
 * Simple Start Script for Unified Telegram Bot
 * 
 * This script ensures environment variables are loaded before starting the bot
 */

// First, load the environment variables from local-env.js
require('./local-env.js');
console.log('Loaded environment variables from local-env.js');

// Then start the bot
require('./index.js');
console.log('Starting unified Telegram bot...'); 