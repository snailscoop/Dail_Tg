/**
 * Unified Telegram Bot with CHEQD Moderation System
 * 
 * This script combines the original Dail_Tg bot functionality with
 * the CHEQD-powered moderation system for consent-based, verifiable moderation.
 */

const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { MessageDeletionQueue, TelegramErrorHandler } = require('./Dail_Tg/messageQueue');

// Import local environment variables
let localEnv;
try {
  localEnv = require('./local-env.js');
  console.log('Using local environment configuration');
} catch (error) {
  console.log('Local environment config not found, using .env file');
}

// Import objects and options from external files
const objects = require('./Dail_Tg/list.js');
const options = require('./Dail_Tg/options.js');
const snailsFacts = require('./Dail_Tg/snails.js');

// Import CHEQD moderation system
const config = require('./cheqd/config');
const gundb = require('./storage/gundb');
const didMapping = require('./telegram/services/didMapping');
const moderationService = require('./telegram/services/moderationService');
const moderationCommands = require('./telegram/commands/moderationCommands');
const didCommands = require('./telegram/commands/didCommands');

// Load environment variables from the .env file if not loaded from local-env.js
if (!localEnv) {
  dotenv.config();
}
const token = process.env.TOKEN || config.token;

// Add error handling for missing token
if (!token) {
  throw new Error('BOT_TOKEN is required in environment variables');
}

// Validate CHEQD configuration
config.validateConfig();

// Constants
const TIMEOUT_DURATION = options.behavior.messageLifetime || 15000;

// Initialize the Telegram bot with the token and updated polling settings
const bot = new TelegramBot(token, {
  polling: false, // Start with polling disabled
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
});

// First, delete any active webhook to avoid conflicts
console.log('Removing any existing webhook...');
bot.deleteWebHook({ drop_pending_updates: true })
  .then(() => {
    console.log('Webhook deleted successfully, starting polling...');
    // Now start polling after webhook is cleared
    bot.startPolling({
      interval: options.telegram.polling.interval || 300,
      params: {
        timeout: options.telegram.polling.timeout || 10,
        allowed_updates: options.telegram.polling.allowed_updates || ["message", "callback_query", "inline_query"]
      }
    });
    
    // Continue with the rest of the setup
    // Initialize the GunDB peer for the bot
    const gun = gundb.initBotNode();

    // Initialize CHEQD services
    didMapping.initialize(gun);
    moderationService.initialize(bot, gun);

    console.log('Bot initialized successfully!');
  })
  .catch(error => {
    console.error('Error removing webhook:', error);
    process.exit(1);
  });

// Error handling for bot initialization
const messageQueue = new MessageDeletionQueue(bot);
const errorHandler = new TelegramErrorHandler(bot);

// Use the new error handler for bot errors
bot.on('error', (error) => errorHandler.handleBotError(error));
bot.on('polling_error', (error) => errorHandler.handlePollingError(error));

// Utility functions
const getUserName = (msg) => msg.from.first_name || msg.from.username || 'there';

const sendDisappearingMessage = async (chatId, text, timeout = TIMEOUT_DURATION) => {
  try {
    const sentMessage = await bot.sendMessage(chatId, text);
    setTimeout(() => {
      bot.deleteMessage(chatId, sentMessage.message_id)
        .catch(err => console.error('Error deleting message:', err));
    }, timeout);
    return sentMessage;
  } catch (error) {
    console.error('Error sending message:', error);
  }
};

// Command deletion
const deleteCommand = async (msg) => {
  try {
    if (!msg || !msg.chat || !msg.message_id) {
      console.warn('Invalid message object provided for deletion');
      return;
    }

    const chatId = msg.chat.id;
    const messageId = msg.message_id;

    // Add a small delay before deletion to ensure message is registered
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      await bot.deleteMessage(chatId, messageId);
    } catch (error) {
      // Handle specific Telegram error codes
      if (error.code === 'ETELEGRAM') {
        switch (error.response.body.error_code) {
          case 400: // Bad Request
            if (error.response.body.description.includes('message to delete not found')) {
              console.warn(`Message ${messageId} in chat ${chatId} already deleted or not found`);
            } else {
              console.warn(`Bad request while deleting message: ${error.response.body.description}`);
            }
            break;
          case 403: // Forbidden
            console.warn(`Bot lacks permission to delete message ${messageId} in chat ${chatId}`);
            break;
          default:
            console.error(`Telegram API error: ${error.response.body.description}`);
        }
      } else {
        // Handle non-Telegram errors
        console.error('Unexpected error during message deletion:', error);
      }
    }
  } catch (error) {
    console.error('Critical error in deleteCommand:', error);
  }
};

// =======================================
// Original Bot Commands and Functionality
// =======================================

// Handle /start command
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);
  
  await deleteCommand(msg);
  
  const welcomeMessage = `Hello ${userName}! ${objects.responses.welcome}`;
  await bot.sendMessage(chatId, welcomeMessage);
});

// Handle /info command
bot.onText(/\/info/, async (msg) => {
  const chatId = msg.chat.id;
  
  await deleteCommand(msg);
  
  const infoMessage = `Bot Information:
Name: ${objects.info.botName}
Version: ${objects.info.version}
Description: ${objects.info.description}`;
  
  await sendDisappearingMessage(chatId, infoMessage);
});

// Handle /snailfact command
bot.onText(/\/snailfact/, async (msg) => {
  const chatId = msg.chat.id;
  
  await deleteCommand(msg);
  
  const fact = snailsFacts.getRandomFact();
  await sendDisappearingMessage(chatId, `🐌 Snail Fact: ${fact}`);
});

// Handle /search command
bot.onText(/\/search (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const searchTerm = match[1];
  
  await deleteCommand(msg);
  
  // Simple search functionality - in a real bot this would do actual searching
  await sendDisappearingMessage(chatId, `Searching for: "${searchTerm}"...`);
});

// =======================================
// CHEQD Moderation Commands
// =======================================

// Command Handlers for CHEQD
const handleHelp = async (msg) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);

  await deleteCommand(msg);

  const helpMessage = `Hello ${userName}! Welcome to the Unified Dail_Tg Bot!

Available commands:
/help - Show this help message
/start - Start the bot
/info - Get information about the bot
/snailfact - Get a random fact about snails
/search [term] - Search for information

DID Commands:
/mydid - Get or create your DID (Decentralized Identifier)
/mycredentials - View your credentials and privileges
/didhelp - Show help for DID-related commands

Moderation commands (require permissions):
/ban @username reason - Ban a user with consent verification
/mute @username reason - Mute a user for 1 hour with consent verification
/banlist - View the list of banned users with their consent records
/makemoderator @username - Grant moderator privileges to a user
/revokemoderator @username - Revoke moderator privileges from a user
/trust @username - Add a user as a trusted member without full moderator privileges
/untrust @username - Remove a user from the trusted members list
/trustedlist - View all trusted members in this chat
/deletemedia - Delete media message (use as reply to media)

Cross-Chat Ban System:
/crossbanstatus - Check participation status
/crossbanoptin - Opt in to share ban information across chats
/crossbanoptout - Opt out of cross-chat ban system`;

  await sendDisappearingMessage(chatId, helpMessage);
};

// Register help command
bot.onText(/\/help/, handleHelp);

// Register moderation command handlers
moderationCommands.registerModerationCommands(bot);
didCommands.registerDidCommands(bot);

console.log('Unified Dail_Tg Telegram bot with CHEQD moderation system started!');
console.log('Original commands enabled: /start, /info, /snailfact, /search');
console.log('Moderation commands enabled: /ban, /mute, /makemoderator, /revokemoderator, /trust, /untrust, /banlist, /trustedlist, /deletemedia');

// Add callback handler for inline keyboard
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  
  // Process the existing callback query logic
  if (data.startsWith('option_')) {
    // Extract data
    const parts = data.split('_');
    const category = parts[1];
    const optionIndex = parseInt(parts[2]);
    const userId = parseInt(parts[3]);
    
    // Verify the user who clicked is the same who initiated
    if (callbackQuery.from.id !== userId) {
      await bot.answerCallbackQuery(callbackQuery.id, {
        text: 'This button is not for you.',
        show_alert: true
      });
      return;
    }
    
    // Find the option
    const categoryOptions = options.find(item => item.name.toLowerCase() === category.toLowerCase());
    
    if (categoryOptions && categoryOptions.options[optionIndex]) {
      const selectedOption = categoryOptions.options[optionIndex];
      
      // Send the response
      const responseText = `You selected: ${selectedOption.name}. Here's the link: ${selectedOption.URL}`;
      
      await bot.deleteMessage(msg.chat.id, msg.message_id);
      await sendDisappearingMessage(msg.chat.id, responseText);
    }
    
    // Answer the callback query
    await bot.answerCallbackQuery(callbackQuery.id);
  }
}); 