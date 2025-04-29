/**
 * DID Commands
 * 
 * This module defines command handlers for DID-related operations
 * such as creating DIDs, checking DID status, and viewing credentials.
 */

const didMapping = require('../services/didMapping');
const credentialService = require('../services/credentialService');

/**
 * Handle /mydid command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleMyDidCommand(bot, msg) {
  const userId = msg.from.id;
  const username = msg.from.username;
  const chatId = msg.chat.id;
  
  console.log(`[Bot] User ${username} (${userId}) requested their DID in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete mydid command: ${err.message}`);
  });
  
  try {
    // Get user's DID
    let did = await didMapping.getDidForUser(userId);
    
    if (!did) {
      // Create a new DID if the user doesn't have one
      did = await didMapping.ensureUserHasDid(userId, msg.from.username);
      
      const successMsg = await bot.sendMessage(chatId, 
        `Your DID has been created:\n${did}\n\n` +
        `This DID is stored on the cheqd blockchain and can be used for verifiable credentials.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, successMsg.message_id).catch(() => {});
      }, 30000);
    } else {
      const didMsg = await bot.sendMessage(chatId, 
        `Your DID is:\n${did}\n\n` +
        `This DID is stored on the cheqd blockchain and is used for your verifiable credentials.`);
      
      setTimeout(() => {
        bot.deleteMessage(chatId, didMsg.message_id).catch(() => {});
      }, 30000);
    }
  } catch (error) {
    console.error('Error in mydid command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error retrieving your DID: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /mycredentials command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleMyCredentialsCommand(bot, msg) {
  const userId = msg.from.id;
  const username = msg.from.username;
  const chatId = msg.chat.id;
  
  console.log(`[Bot] User ${username} (${userId}) requested their credentials in chat ${chatId}`);
  console.log(`[Debug] User ID type: ${typeof userId}. Value: ${userId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete mycredentials command: ${err.message}`);
  });
  
  try {
    // Ensure user has a DID
    const did = await didMapping.ensureUserHasDid(userId, msg.from.username);
    console.log(`[Debug] User DID: ${did}`);
    
    // Check moderator status
    console.log(`[Debug] Checking if user has moderator credential for chatId: ${chatId}`);
    const isModerator = await credentialService.userHasModeratorCredential(userId.toString(), chatId.toString());
    console.log(`[Debug] User has moderator credential: ${isModerator}`);
    
    const isAdmin = await credentialService.userHasAdminPrivileges(userId.toString(), chatId.toString());
    console.log(`[Debug] User has admin privileges: ${isAdmin}`);
    
    // Check if user is a trusted member
    const gundb = require('../../storage/gundb');
    const gun = gundb.initBotNode();
    console.log(`[Debug] Checking if user is trusted member - userId: ${userId} (${typeof userId}), chatId: ${chatId} (${typeof chatId})`);
    console.log(`[Debug] Using toString() - userId: ${userId.toString()} (${typeof userId.toString()}), chatId: ${chatId.toString()} (${typeof chatId.toString()})`);
    
    const isTrusted = await gundb.isUserTrusted(gun, userId.toString(), chatId.toString());
    console.log(`[Debug] User is trusted member: ${isTrusted}`);
    
    let credentialsText = 'Your Credentials:\n\n';
    
    if (isModerator) {
      credentialsText += '✅ You have moderator privileges in this chat.\n';
      credentialsText += 'You can use /ban, /mute, and /banlist commands.\n\n';
    }
    
    if (isAdmin) {
      credentialsText += '✅ You have administrator privileges in this chat.\n';
      credentialsText += 'You can use /makemoderator to assign moderator privileges to others.\n\n';
    }
    
    if (isTrusted) {
      credentialsText += '✅ You are a trusted member in this chat.\n';
      credentialsText += 'You have access to certain privileged actions, but not full moderation capabilities.\n\n';
    }
    
    if (!isModerator && !isAdmin && !isTrusted) {
      credentialsText += 'You do not have any special credentials for this chat.\n\n';
    }
    
    credentialsText += `Your DID: ${did}\n`;
    credentialsText += 'All credentials are stored on the cheqd blockchain.';
    
    const credMsg = await bot.sendMessage(chatId, credentialsText);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, credMsg.message_id).catch(() => {});
    }, 30000);
  } catch (error) {
    console.error('Error in mycredentials command:', error);
    
    const errorMsg = await bot.sendMessage(chatId, 
      `Error retrieving your credentials: ${error.message}`);
    
    setTimeout(() => {
      bot.deleteMessage(chatId, errorMsg.message_id).catch(() => {});
    }, 10000);
  }
}

/**
 * Handle /didhelp command
 * @param {Object} bot - Telegram bot instance
 * @param {Object} msg - Telegram message object
 * @returns {Promise<void>}
 */
async function handleDidHelpCommand(bot, msg) {
  const userId = msg.from.id;
  const username = msg.from.username;
  const chatId = msg.chat.id;
  
  console.log(`[Bot] User ${username} (${userId}) requested DID help in chat ${chatId}`);
  
  // Delete the command message
  await bot.deleteMessage(chatId, msg.message_id).catch(err => {
    console.warn(`Could not delete didhelp command: ${err.message}`);
  });
  
  const helpText = `Hello ${username}! Here are the DID-related commands:

/mydid - Get or create your DID (Decentralized Identifier)
/mycredentials - View your credentials and privileges
/didhelp - Show this help message

For moderators:
/ban @username reason - Ban a user with consent verification
/mute @username reason - Mute a user for 1 hour with consent verification
/banlist - View the list of banned users with their consent records

For administrators:
/makemoderator @username - Grant moderator privileges to a user

Cross-Chat Ban System:
/crossbanstatus - Check if this chat participates in cross-chat ban system
/crossbanoptin - Opt in to the cross-chat ban system
/crossbanoptout - Opt out of the cross-chat ban system

All actions are verified using DIDs on the cheqd blockchain and include consent records for transparency.`;

  const helpMsg = await bot.sendMessage(chatId, helpText);
  
  setTimeout(() => {
    bot.deleteMessage(chatId, helpMsg.message_id).catch(() => {});
  }, 30000);
}

/**
 * Register DID commands with the bot
 * @param {Object} bot - Telegram bot instance
 */
function registerDidCommands(bot) {
  // Register command handlers
  bot.onText(/\/mydid/, (msg) => {
    handleMyDidCommand(bot, msg);
  });
  
  bot.onText(/\/mycredentials/, (msg) => {
    handleMyCredentialsCommand(bot, msg);
  });
  
  bot.onText(/\/didhelp/, (msg) => {
    handleDidHelpCommand(bot, msg);
  });
}

module.exports = {
  registerDidCommands,
  handleMyDidCommand,
  handleMyCredentialsCommand,
  handleDidHelpCommand,
}; 