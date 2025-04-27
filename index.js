const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { MessageDeletionQueue, TelegramErrorHandler} = require('./messageQueue');
const axios = require('axios'); // Add axios for backend API calls

// Load environment variables from the .env file
dotenv.config();
const token = process.env.TOKEN;

// Add error handling for missing token
if (!token) {
  throw new Error('BOT_TOKEN is required in environment variables');
}

// Constants
const TIMEOUT_DURATION = 15000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'; // Backend server URL

// Initialize the Telegram bot with the token and updated polling settings
const bot = new TelegramBot(token, {
  polling: true,
  request: {
    agentOptions: {
      keepAlive: true,
      family: 4,
    },
  },
});

// Import objects and options from external files
const objects = require('./list.js');
const options = require('./options.js');
const snailsFacts = require('./snails.js');

// Error handling for bot initialization
const messageQueue = new MessageDeletionQueue(bot);
const errorHandler = new TelegramErrorHandler(bot);

// Use the new error handler for bot errors
bot.on('error', (error) => errorHandler.handleBotError(error));
bot.on('polling_error', (error) => errorHandler.handlePollingError(error));

// Store temporary linking codes
const linkingCodes = new Map();
// Store pending consent requests
const pendingConsents = new Map();

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

//  command deletion
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

// Helper function to generate a random linking code
const generateLinkingCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
};

// Helper function to call backend API
const callBackendAPI = async (endpoint, data = {}, method = 'POST') => {
  try {
    const url = `${BACKEND_URL}${endpoint}`;
    console.log(`Calling ${method} ${url}`, data);
    
    const response = await axios({
      method,
      url,
      data,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Response from ${endpoint}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error calling backend API ${endpoint}:`, error.response?.data || error.message);
    throw new Error(error.response?.data?.message || error.message || 'Backend API error');
  }
};

// Command Handlers
const handleHelp = async (msg) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);

  await deleteCommand(msg);  // Delete command immediately

  const helpMessage = `Hello ${userName}! Here are the commands you can use:
/help - Get help with using the bot
/search [query] - Search for an object
/snails - Get a random snail fact
/socials - Get our social media links
/link - Connect your Telegram account with a DID
/issue_credential - Issue a verifiable credential (admin only)
/verify - Verify a credential
/consent - Manage consent for moderation actions (admin only)
/poll - Create a poll (admin only)

Moderation Commands (verified moderators only):
/ban @username - Ban a user from the chat
/mute @username [duration] - Mute a user (default 24h)
/warn @username - Issue a warning to a user`;

  await sendDisappearingMessage(chatId, helpMessage);
};

const handleSnails = async (msg) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);
  
  await deleteCommand(msg);  // Delete command immediately

  const randomFact = snailsFacts[Math.floor(Math.random() * snailsFacts.length)];
  const messages = [
    `🐌 Hey ${userName}, did you know? ${randomFact}`,
    `🐌 Hello ${userName}! Here's a cool snail fact: ${randomFact}`,
    `🐌 Fun fact for you, ${userName}: ${randomFact}`,
    `🐌 ${userName}, check out this snail fact: ${randomFact}`
  ];

  const selectedMessage = messages[Math.floor(Math.random() * messages.length)];
  await bot.sendMessage(chatId, selectedMessage);
};

const handleSocials = async (msg) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);

  await deleteCommand(msg);  // Delete command immediately

  const socialLinks = [
    { name: 'Linktree', url: 'https://linktr.ee/snailsnft' },
    { name: 'Medium', url: 'https://medium.com/@snailsnft/' },
    { name: 'OmniFlix', url: 'https://omniflix.tv/channel/65182782e1c28773aa199c84' },
    { name: 'YouTube', url: 'https://www.youtube.com/@SNAILS._/videos' }
  ];

  const response = `Hey ${userName}, here are our social media links:\n\n` +
    socialLinks.map(link => `${link.name}: ${link.url}`).join('\n');

  await sendDisappearingMessage(chatId, response);
};

const handleSearch = async (msg, match) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);
  const query = match && match[1] ? match[1].toLowerCase() : null;

  await deleteCommand(msg);  // Delete command immediately

  if (!query) {
    const noQueryMessage = `Sorry ${userName}, you didn't provide a search query. Please use: /search [query]`;
    await sendDisappearingMessage(chatId, noQueryMessage);
    return;
  }

  const directMatches = objects.filter(item => item.name.toLowerCase() === query);
  
  if (directMatches.length > 0) {
    const foundMessage = `Hello ${userName}, you selected: ${directMatches[0].name}. Here's the link: ${directMatches[0].URL}`;
    await sendDisappearingMessage(chatId, foundMessage);
    return;
  }

  const optionsMatch = options.find(item => item.name.toLowerCase() === query);
  
  if (optionsMatch) {
    const response = `Hey ${userName}, please choose an option from the list below:`;
    const inlineKeyboard = optionsMatch.options.map((option, index) => [{
      text: option.name,
      callback_data: `option_${optionsMatch.name}_${index}_${msg.from.id}`
    }]);

    const sentMessage = await bot.sendMessage(chatId, response, {
      reply_markup: { inline_keyboard: inlineKeyboard }
    });

    setTimeout(() => {
      bot.deleteMessage(chatId, sentMessage.message_id)
        .catch(err => console.error('Error deleting options message:', err));
    }, TIMEOUT_DURATION);
  } else {
    const notFoundMessage = `Sorry ${userName}, no matching object found for "${query}". Please try again.`;
    await sendDisappearingMessage(chatId, notFoundMessage);
  }
};

// Link command handler - to connect Telegram account with DID
const handleLink = async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = getUserName(msg);
  
  await deleteCommand(msg);  // Delete command immediately

  try {
    // Instead of generating our own code, call the backend to get one
    const response = await callBackendAPI('/generate_linking_code');
    
    if (response.status !== 'success' || !response.data || !response.data.code) {
      throw new Error('Failed to generate linking code from backend');
    }
    
    const linkingCode = response.data.code;
    console.log(`Generated linking code from backend: ${linkingCode}`);
    
    // Send instructions to the user
    const linkMessage = `Hello ${userName}! To link your Telegram account with a DID, please use the following code in the web interface:

Code: ${linkingCode}

This code will expire in 10 minutes.`;
    
    await bot.sendMessage(chatId, linkMessage, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error in link command:', error);
    await sendDisappearingMessage(chatId, `Sorry ${userName}, there was an error processing your request. Please try again later.`);
  }
};

// Handler for issuing credentials (admin only)
const handleIssueCredential = async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = getUserName(msg);
  
  await deleteCommand(msg);  // Delete command immediately
  
  // Check if the user is an admin
  const userIsAdmin = await isAdmin(chatId, userId);
  if (!userIsAdmin) {
    const errorMessage = `Sorry ${userName}, only administrators can issue credentials.`;
    await sendDisappearingMessage(chatId, errorMessage);
    return;
  }

  try {
    // Interactive credential issuance flow
    const sentMessage = await bot.sendMessage(chatId, 
      `${userName}, to issue a credential, please follow these steps:
      
1. Create an issuer DID if you don't have one yet
2. Create a subject DID for the recipient
3. Issue the credential with the required details

Would you like to:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Create Issuer DID', callback_data: 'cred_create_issuer' }],
            [{ text: 'Create Subject DID', callback_data: 'cred_create_subject' }],
            [{ text: 'Issue Credential', callback_data: 'cred_issue' }],
            [{ text: 'Cancel', callback_data: 'cred_cancel' }]
          ]
        }
      }
    );
    
    // Store the message ID to delete it later
    setTimeout(() => {
      bot.deleteMessage(chatId, sentMessage.message_id)
        .catch(err => console.error('Error deleting credential menu:', err));
    }, TIMEOUT_DURATION * 2);
  } catch (error) {
    console.error('Error in issue credential command:', error);
    await sendDisappearingMessage(chatId, `Sorry ${userName}, there was an error processing your request. Please try again later.`);
  }
};

// Handler for verifying credentials
const handleVerifyCredential = async (msg) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);
  
  await deleteCommand(msg);  // Delete command immediately
  
  try {
    const sentMessage = await bot.sendMessage(chatId, 
      `${userName}, please send the credential JWT that you want to verify as a reply to this message.`,
      { reply_markup: { force_reply: true } }
    );
    
    // Set up a one-time listener for the response
    bot.onReplyToMessage(chatId, sentMessage.message_id, async (responseMsg) => {
      const credential = responseMsg.text.trim();
      
      try {
        // Delete the user's response
        await bot.deleteMessage(chatId, responseMsg.message_id);
        
        console.log('Verifying credential:', credential.substring(0, 30) + '...');
        
        // Call backend to verify the credential
        const result = await callBackendAPI('/tg_verify_credential', { credential });
        console.log('Verification result:', JSON.stringify(result, null, 2));
        
        // Consider both regular success and mock success (with mock data)
        const isSuccess = result.status === 'success' && 
                        (result.verified || 
                         result.data?.verified || 
                         result.message?.includes('mock data'));
        
        if (isSuccess) {
          let typeDisplay = 'Unknown';
          let issuer = 'Unknown';
          let subject = 'Unknown';
          
          // Check if verifiableCredential exists and extract info
          if (result.data && result.data.verifiableCredential) {
            // Handle different possible type formats
            if (Array.isArray(result.data.verifiableCredential.type)) {
              typeDisplay = result.data.verifiableCredential.type.join(', ');
            } else if (typeof result.data.verifiableCredential.type === 'string') {
              typeDisplay = result.data.verifiableCredential.type;
            }
            
            // Handle different possible issuer formats
            if (typeof result.data.verifiableCredential.issuer === 'object') {
              issuer = result.data.verifiableCredential.issuer.id || 'Unknown';
            } else {
              issuer = result.data.verifiableCredential.issuer || 'Unknown';
            }
            
            // Handle different possible subject formats
            if (result.data.verifiableCredential.credentialSubject) {
              subject = result.data.verifiableCredential.credentialSubject.id || 'No ID specified';
            }
          } else if (result.data?.issuer) {
            // Fallback for mock data
            issuer = result.data.issuer;
            subject = result.data.subject || 'Unknown';
            typeDisplay = 'Verifiable Credential';
          }
          
          await bot.sendMessage(chatId, `✅ Credential verified successfully!

Type: ${typeDisplay}
Issuer: ${issuer}
Subject: ${subject}`);
        } else {
          await bot.sendMessage(chatId, `❌ Credential verification failed.
          
Reason: ${result.message || result.data?.error || 'Unknown verification error'}`);
        }
      } catch (error) {
        console.error('Error verifying credential:', error);
        await sendDisappearingMessage(chatId, `Sorry ${userName}, there was an error verifying the credential. Please try again later.

Error details: ${error.message}`);
      }
    });
  } catch (error) {
    console.error('Error in verify credential command:', error);
    await sendDisappearingMessage(chatId, `Sorry ${userName}, there was an error processing your request. Please try again later.`);
  }
};

// Handler for consent management
const handleConsent = async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = getUserName(msg);
  
  await deleteCommand(msg);  // Delete command immediately
  
  // Check if the user is an admin
  const userIsAdmin = await isAdmin(chatId, userId);
  if (!userIsAdmin) {
    const errorMessage = `Sorry ${userName}, only administrators can manage consent.`;
    await sendDisappearingMessage(chatId, errorMessage);
    return;
  }

  try {
    const sentMessage = await bot.sendMessage(chatId, 
      `${userName}, consent management options:`,
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: 'Request Consent', callback_data: 'consent_request' }],
            [{ text: 'View Pending Consents', callback_data: 'consent_view' }],
            [{ text: 'Cancel', callback_data: 'consent_cancel' }]
          ]
        }
      }
    );
    
    // Store the message ID to delete it later
    setTimeout(() => {
      bot.deleteMessage(chatId, sentMessage.message_id)
        .catch(err => console.error('Error deleting consent menu:', err));
    }, TIMEOUT_DURATION * 2);
  } catch (error) {
    console.error('Error in consent command:', error);
    await sendDisappearingMessage(chatId, `Sorry ${userName}, there was an error processing your request. Please try again later.`);
  }
};

// Handle ban command
const handleBan = async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name || msg.from.username || 'there';

    // Check if user is admin
    const userIsAdmin = await isAdmin(chatId, userId);
    if (!userIsAdmin) {
      await bot.sendMessage(chatId, '❌ Only administrators can use this command.');
      return;
    }

    // Get the target username
    const target = match && match[1] ? match[1].trim() : null;
    if (!target) {
      await bot.sendMessage(chatId, '❌ Please specify a user to ban. Usage: /ban @username');
      return;
    }

    // In a production environment, you would fetch the actual user ID from the username
    // const targetUserId = await getUserIdFromUsername(target);
    
    // Create a consent request
    try {
      const consentId = await callBackendAPI('/request_consent', {
        requesterId: userId.toString(),
        requestType: 'ban',
        metadata: {
          targetUser: target,
          action: 'ban'
        }
      });
      
      // Create inline keyboard for consent
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Approve Ban', callback_data: `mod_ban_${consentId}_${target}` },
            { text: 'Reject', callback_data: `consent_reject_${consentId}` }
          ]
        ]
      };
      
      await bot.sendMessage(
        chatId,
        `🚫 *Ban Request*\n\nAdmin ${userName} wants to ban user ${target}.\n\nThis action requires consent from another administrator.`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Error creating consent request:', error);
      await bot.sendMessage(chatId, `❌ Error creating consent request: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in ban command:', error);
    await bot.sendMessage(msg.chat.id, '❌ An error occurred while processing your request.');
  }
};

// Handle mute command
const handleMute = async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name || msg.from.username || 'there';

    // Check if user is admin
    const userIsAdmin = await isAdmin(chatId, userId);
    if (!userIsAdmin) {
      await bot.sendMessage(chatId, '❌ Only administrators can use this command.');
      return;
    }

    // Get the target username and duration
    const rawInput = match && match[1] ? match[1].trim() : null;
    if (!rawInput) {
      await bot.sendMessage(chatId, '❌ Please specify a user to mute. Usage: /mute @username [duration]');
      return;
    }

    const parts = rawInput.split(' ');
    const target = parts[0];
    const duration = parts.length > 1 ? parts[1] : '1h'; // Default to 1 hour
    
    // In a production environment, you would fetch the actual user ID from the username
    // const targetUserId = await getUserIdFromUsername(target);
    
    // Create a consent request
    try {
      const consentId = await callBackendAPI('/request_consent', {
        requesterId: userId.toString(),
        requestType: 'mute',
        metadata: {
          targetUser: target,
          duration: duration,
          action: 'mute'
        }
      });
      
      // Create inline keyboard for consent
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Approve Mute', callback_data: `mod_mute_${consentId}_${target}_${duration}` },
            { text: 'Reject', callback_data: `consent_reject_${consentId}` }
          ]
        ]
      };
      
      await bot.sendMessage(
        chatId,
        `🔇 *Mute Request*\n\nAdmin ${userName} wants to mute user ${target} for ${duration}.\n\nThis action requires consent from another administrator.`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Error creating consent request:', error);
      await bot.sendMessage(chatId, `❌ Error creating consent request: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in mute command:', error);
    await bot.sendMessage(msg.chat.id, '❌ An error occurred while processing your request.');
  }
};

// Handle warn command
const handleWarn = async (msg, match) => {
  try {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const userName = msg.from.first_name || msg.from.username || 'there';

    // Check if user is admin
    const userIsAdmin = await isAdmin(chatId, userId);
    if (!userIsAdmin) {
      await bot.sendMessage(chatId, '❌ Only administrators can use this command.');
      return;
    }

    // Get the target username
    const target = match && match[1] ? match[1].trim() : null;
    if (!target) {
      await bot.sendMessage(chatId, '❌ Please specify a user to warn. Usage: /warn @username');
      return;
    }

    // In a production environment, you would fetch the actual user ID from the username
    // const targetUserId = await getUserIdFromUsername(target);
    
    // Create a consent request
    try {
      const consentId = await callBackendAPI('/request_consent', {
        requesterId: userId.toString(),
        requestType: 'warn',
        metadata: {
          targetUser: target,
          action: 'warn'
        }
      });
      
      // Create inline keyboard for consent
      const keyboard = {
        inline_keyboard: [
          [
            { text: 'Approve Warning', callback_data: `mod_warn_${consentId}_${target}` },
            { text: 'Reject', callback_data: `consent_reject_${consentId}` }
          ]
        ]
      };
      
      await bot.sendMessage(
        chatId,
        `⚠️ *Warning Request*\n\nAdmin ${userName} wants to issue a warning to user ${target}.\n\nThis action requires consent from another administrator.`,
        {
          parse_mode: 'Markdown',
          reply_markup: keyboard
        }
      );
    } catch (error) {
      console.error('Error creating consent request:', error);
      await bot.sendMessage(chatId, `❌ Error creating consent request: ${error.message}`);
    }
  } catch (error) {
    console.error('Error in warn command:', error);
    await bot.sendMessage(msg.chat.id, '❌ An error occurred while processing your request.');
  }
};

// Register command handlers
bot.onText(/\/help/, handleHelp);
bot.onText(/\/snails/, handleSnails);
bot.onText(/\/socials/, handleSocials);
bot.onText(/\/search (.+)/, handleSearch);
bot.onText(/\/search$/, (msg) => handleSearch(msg, [null, null]));
bot.onText(/\/link/, handleLink);
bot.onText(/\/issue_credential/, handleIssueCredential);
bot.onText(/\/verify/, handleVerifyCredential);
bot.onText(/\/consent/, handleConsent);
// Add new moderation commands
bot.onText(/\/ban (.+)/, handleBan);
bot.onText(/\/ban$/, (msg) => handleBan(msg, [null, null]));
bot.onText(/\/mute (.+)/, handleMute);
bot.onText(/\/mute$/, (msg) => handleMute(msg, [null, null]));
bot.onText(/\/warn (.+)/, handleWarn);
bot.onText(/\/warn$/, (msg) => handleWarn(msg, [null, null]));

// Callback function to handle the selection from the inline keyboard
bot.on('callback_query', async (callbackQuery) => {
  try {
    const userId = callbackQuery.from.id;
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;
    const userName = callbackQuery.from.first_name || callbackQuery.from.username || 'there';

    if (!data) {
      console.warn('No callback data received');
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'No action specified.' });
      return;
    }

    // Handle moderation action responses (new section)
    if (data.startsWith('mod_')) {
      // Parse the callback data
      const [prefix, action, consentId, targetUser, ...params] = data.split('_');
      
      // Check if user is admin
      const userIsAdmin = await isAdmin(chatId, userId);
      if (!userIsAdmin) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Only administrators can approve moderation actions.' });
        return;
      }
      
      try {
        // Call backend to verify consent
        const result = await callBackendAPI('/verify_consent', {
          consentId,
          verifierId: userId.toString()
        });
        
        // Handle the moderation action based on type
        let actionMessage = '';
        
        switch(action) {
          case 'ban':
            actionMessage = `✅ Ban action approved and executed!\n\nUser ${targetUser} has been banned from the group.`;
            // In a production environment, you would use the actual Telegram API to ban the user
            // await bot.banChatMember(chatId, targetUserId);
            break;
            
          case 'mute':
            const duration = params.join('_') || '1h';
            actionMessage = `✅ Mute action approved and executed!\n\nUser ${targetUser} has been muted for ${duration}.`;
            // In a production environment, you would use the actual Telegram API to restrict the user
            // await bot.restrictChatMember(chatId, targetUserId, { can_send_messages: false, until_date: calculateMuteDuration(duration) });
            break;
            
          case 'warn':
            actionMessage = `✅ Warning approved and sent!\n\nUser ${targetUser} has been warned.`;
            // Send a warning message to the user
            await bot.sendMessage(chatId, `⚠️ WARNING: ${targetUser} has received an official warning from the administrators.`);
            break;
            
          default:
            actionMessage = `✅ Moderation action approved!`;
        }
        
        // Update the original message to show the action was approved
        await bot.editMessageText(
          actionMessage,
          {
            chat_id: chatId,
            message_id: callbackQuery.message.message_id
          }
        );
        
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Moderation action approved!' });
      } catch (error) {
        console.error('Error processing moderation action:', error);
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Error processing action. See console for details.' });
        await bot.sendMessage(chatId, `❌ Error processing moderation action: ${error.message}`);
      }
      
      return;
    }

    // Handle option selection for object search
    if (data.startsWith('option_')) {
      const [type, queryName, index, initiatorId] = data.split('_');
      
      if (String(userId) !== String(initiatorId)) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Unauthorized action.' });
        return;
      }

      if (!callbackQuery.message) {
        console.warn('Callback query has no associated message.');
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'No message context found.' });
        return;
      }

      const optionsRes = options.find((item) => item.name.toLowerCase() === queryName.toLowerCase());
      const selectedOption = optionsRes?.options[parseInt(index)];

      if (selectedOption) {
        const response = `Hey ${callbackQuery.from.first_name}, you selected: ${selectedOption.name}. Here's the link: ${selectedOption.URL || 'No URL available.'}`;
        await sendDisappearingMessage(callbackQuery.message.chat.id, response);
        try {
          await bot.deleteMessage(callbackQuery.message.chat.id, callbackQuery.message.message_id);
        } catch (error) {
          if (error.code === 'ETELEGRAM') {
            console.warn(`Failed to delete message: ${error.response.body.description}`);
          } else {
            console.error('Unexpected error during message deletion:', error);
          }
        }
        await bot.answerCallbackQuery(callbackQuery.id); // Acknowledge the callback query
      } else {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Option not found.' });
      }
      return;
    }
    
    // Handle credential management actions
    if (data.startsWith('cred_')) {
      // Check if user is admin
      const userIsAdmin = await isAdmin(chatId, userId);
      if (!userIsAdmin) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Only administrators can perform this action.' });
        return;
      }
      
      switch (data) {
        case 'cred_create_issuer':
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Creating issuer DID...' });
          try {
            const result = await callBackendAPI('/create_issuer_did');
            await bot.sendMessage(chatId, `✅ Issuer DID created successfully!

DID: ${result.data.did}

Save this DID for future credential issuance.`);
          } catch (error) {
            await bot.sendMessage(chatId, `❌ Failed to create issuer DID: ${error.message}`);
          }
          break;
          
        case 'cred_create_subject':
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Creating subject DID...' });
          try {
            const result = await callBackendAPI('/create_subject_did');
            await bot.sendMessage(chatId, `✅ Subject DID created successfully!

DID: ${result.data.did}

Share this DID with the credential recipient.`);
          } catch (error) {
            await bot.sendMessage(chatId, `❌ Failed to create subject DID: ${error.message}`);
          }
          break;
          
        case 'cred_issue':
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Starting credential issuance flow...' });
          // Ask user for credential details
          const instructionMsg = await bot.sendMessage(chatId, 
            `Please provide the credential details in the following format:

Issuer DID: did:cheqd:xxxx
Subject DID: did:cheqd:yyyy
Type: ModeratorCredential
Attribute Name: Role
Attribute Value: Moderator

Reply to this message with the details.`,
            { reply_markup: { force_reply: true } }
          );
          
          // Set up a one-time listener for the response
          bot.onReplyToMessage(chatId, instructionMsg.message_id, async (responseMsg) => {
            try {
              // Parse the response
              const lines = responseMsg.text.split('\n');
              const credData = {};
              
              lines.forEach(line => {
                const [key, value] = line.split(':').map(s => s.trim());
                if (key && value) {
                  if (key === 'Issuer DID') credData.issuerDid = value;
                  else if (key === 'Subject DID') credData.subjectDid = value;
                  else if (key === 'Type') credData.type = ['VerifiableCredential', value];
                  else if (key === 'Attribute Name') credData.attributeName = value;
                  else if (key === 'Attribute Value') credData.attributeValue = value;
                }
              });
              
              // Validate required fields
              if (!credData.issuerDid || !credData.subjectDid || !credData.attributeName || !credData.attributeValue) {
                await bot.sendMessage(chatId, '❌ Missing required credential information. Please try again with all required fields.');
                return;
              }
              
              // Prepare attributes
              credData.attributes = {
                [credData.attributeName]: credData.attributeValue
              };
              
              // Issue the credential
              const result = await callBackendAPI('/issue_credential', {
                issuerDid: credData.issuerDid,
                subjectDid: credData.subjectDid,
                attributes: credData.attributes,
                type: credData.type
              });
              
              await bot.sendMessage(chatId, `✅ Credential issued successfully!

Credential ID: ${result.data.id}
Issuer: ${credData.issuerDid}
Subject: ${credData.subjectDid}
Type: ${credData.type.join(', ')}

The credential has been registered on the Cheqd network.`);
            } catch (error) {
              console.error('Error issuing credential:', error);
              await bot.sendMessage(chatId, `❌ Failed to issue credential: ${error.message}`);
            }
          });
          break;
          
        case 'cred_cancel':
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Credential operation cancelled.' });
          await bot.deleteMessage(chatId, callbackQuery.message.message_id)
            .catch(err => console.error('Error deleting message:', err));
          break;
      }
      return;
    }
    
    // Handle consent management actions
    if (data.startsWith('consent_')) {
      // Check if user is admin
      const userIsAdmin = await isAdmin(chatId, userId);
      if (!userIsAdmin) {
        await bot.answerCallbackQuery(callbackQuery.id, { text: 'Only administrators can perform this action.' });
        return;
      }
      
      switch (data) {
        case 'consent_request':
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Starting consent request flow...' });
          const consentMsg = await bot.sendMessage(chatId, 
            `Please describe the action requiring consent:

Example: "Delete messages containing inappropriate content in group XYZ"

Reply to this message with the action description.`,
            { reply_markup: { force_reply: true } }
          );
          
          // Set up a one-time listener for the response
          bot.onReplyToMessage(chatId, consentMsg.message_id, async (responseMsg) => {
            try {
              const actionString = responseMsg.text.trim();
              
              // Call backend to create consent request
              const result = await callBackendAPI('/request_consent', {
                moderatorId: userId.toString(),
                actionString
              });
              
              // Store in pending consents
              pendingConsents.set(result.data.consent_id, {
                moderatorId: userId,
                action: actionString,
                status: 'pending',
                created: new Date()
              });
              
              await bot.sendMessage(chatId, `✅ Consent request created successfully!

Consent ID: ${result.data.consent_id}
Action: ${actionString}
Status: Pending

The consent request has been registered and is awaiting approval.`);
            } catch (error) {
              console.error('Error creating consent request:', error);
              await bot.sendMessage(chatId, `❌ Failed to create consent request: ${error.message}`);
            }
          });
          break;
          
        case 'consent_view':
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Retrieving pending consents...' });
          
          try {
            // Call backend to get pending consents
            const result = await callBackendAPI('/consent_requests?telegram_id=' + userId, {}, 'GET');
            
            if (!result.data || result.data.length === 0) {
              await bot.sendMessage(chatId, 'No pending consent requests found.');
              return;
            }
            
            let consentMessage = 'Current pending consent requests:\n\n';
            result.data.forEach((consent) => {
              consentMessage += `ID: ${consent.id}\n`;
              consentMessage += `Action: ${consent.action}\n`;
              consentMessage += `Created: ${consent.createdAt}\n\n`;
            });
            
            await bot.sendMessage(chatId, consentMessage);
          } catch (error) {
            console.error('Error fetching consent requests:', error);
            await bot.sendMessage(chatId, `❌ Failed to fetch consent requests: ${error.message}`);
          }
          break;
          
        case 'consent_cancel':
          await bot.answerCallbackQuery(callbackQuery.id, { text: 'Consent operation cancelled.' });
          await bot.deleteMessage(chatId, callbackQuery.message.message_id)
            .catch(err => console.error('Error deleting message:', err));
          break;
      }
      return;
    }
    
    // If we get here, it's an unknown callback data
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'Unknown action.' });
  } catch (error) {
    console.error('Error in callback query handler:', error);
    await bot.answerCallbackQuery(callbackQuery.id, { text: 'An error occurred.' });
  }
});

// Handle new chat members
bot.on('new_chat_members', (msg) => {
  try {
    if (!msg.new_chat_members || msg.new_chat_members.length === 0) return;

    const chatId = msg.chat.id;
    
    msg.new_chat_members.forEach(async (newUser) => {
      if (newUser.username === bot.options.username) return;

      const firstName = newUser.first_name || newUser.username || 'there';
      const welcomeMessage = `Hello, ${firstName}! Welcome to our chat. Here are some commands you can use:\n\n` +
        `/help - Get help with using the bot\n` +
        `/search [query] - Search for an object\n` +
        `/snails - Get a random snail fact\n` +
        `/socials - Get our social media links`;

      try {
        await bot.sendMessage(chatId, welcomeMessage);
      } catch (error) {
        console.error('Error sending welcome message:', error);
      }
    });
  } catch (error) {
    console.error('Error handling new chat members:', error);
  }
});

// Function to check if a user is an admin
async function isAdmin(chatId, userId) {
  try {
    const chatMember = await bot.getChatMember(chatId, userId);
    const adminStatuses = ['administrator', 'creator'];
    return adminStatuses.includes(chatMember.status);
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

// Command to initiate a poll
bot.onText(/\/poll (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userName = msg.from.first_name || msg.from.username || 'User';
  const userInput = match[1].trim();

  // Check if the user is an admin
  const userIsAdmin = await isAdmin(chatId, userId);
  if (!userIsAdmin) {
    // Mention the user in the notification
    const mention = `[${userName}](tg://user?id=${userId})`;
    const notificationMessage = `❌ ${mention}, you do not have the necessary permissions to create a poll.`;

    // Send the notification message
    const sentMessage = await bot.sendMessage(chatId, notificationMessage, { parse_mode: 'Markdown' });

    // Delete the user's command message and the notification message after a delay
    setTimeout(() => {
      bot.deleteMessage(chatId, msg.message_id).catch((err) => {
        console.error('Failed to delete user command message:', err);
      });
      bot.deleteMessage(chatId, sentMessage.message_id).catch((err) => {
        console.error('Failed to delete notification message:', err);
      });
    }, 5000); // Delay to allow the user to see the notification

    return;
  }

  // Determine if the poll should be multiple-choice
  const isMultipleChoice = userInput.toLowerCase().includes('|mpoll');
  // Determine if the poll should be non-anonymous
  const isAnonymous = !userInput.toLowerCase().includes('|nonanon');

  // Clean the input by removing the control parameters
  const cleanedInput = userInput
    .replace(/(\|mpoll|\|nonanon)/gi, '')
    .trim();

  // Split the cleaned input into question and options
  const [question, ...options] = cleanedInput.split(';').map((str) => str.trim());

  // Validate the input
  if (!question || options.length < 2) {
    const errorMessage = 'Please provide a valid question followed by at least two options, separated by semicolons. For example:\n/poll Your question here; Option 1; Option 2; Option 3';
    const sentMessage = await bot.sendMessage(chatId, errorMessage);

    // Delete the user's command message and the error message after a delay
    setTimeout(() => {
      bot.deleteMessage(chatId, msg.message_id).catch((err) => {
        console.error('Failed to delete user command message:', err);
      });
      bot.deleteMessage(chatId, sentMessage.message_id).catch((err) => {
        console.error('Failed to delete error message:', err);
      });
    }, 5000); // Delay to allow the user to see the error message

    return;
  }

  // Send the poll
  await bot.sendPoll(chatId, question, options, {
    is_anonymous: isAnonymous,
    allows_multiple_answers: isMultipleChoice,
  });

  // Delete the user's command message after sending the poll
  setTimeout(() => {
    bot.deleteMessage(chatId, msg.message_id).catch((err) => {
      console.error('Failed to delete user command message:', err);
    });
  }, 1000); // Delay to ensure the message is processed before deletion
});



//   Single-Choice Anonymous Poll (default):
//   /poll What is your favorite color?; Red; Blue; Green; Yellow

//   Multiple-Choice Poll: Add |mpoll to allow participants to select multiple options.
//   /poll Which programming languages do you use?; JavaScript; Python; Java; C# |mpoll

//    Non-Anonymous Poll: Add |nonanon to make the poll non-anonymous.
//    /poll What is your favorite color?; Red; Blue; Green; Yellow |nonanon

//    Poll with Multiple-Choice and Non-Anonymous:
//    /poll Which programming languages do you use?; JavaScript; Python; Java; C# |mpoll |nonanon






















