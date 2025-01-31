const TelegramBot = require('node-telegram-bot-api');
const dotenv = require('dotenv');
const { MessageDeletionQueue, TelegramErrorHandler} = require('./messageQueue');

// Load environment variables from the .env file
dotenv.config();
const token = process.env.TOKEN;

// Add error handling for missing token
if (!token) {
  throw new Error('BOT_TOKEN is required in environment variables');
}

// Constants
const TIMEOUT_DURATION = 15000;

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
// Command Handlers
const handleHelp = async (msg) => {
  const chatId = msg.chat.id;
  const userName = getUserName(msg);

  await deleteCommand(msg);  // Delete command immediately

  const helpMessage = `Hello ${userName}! Here are the commands you can use:
/help - Get help with using the bot
/search [query] - Search for an object
/snails - Get a random snail fact
/socials - Get our social media links`;

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

// Register command handlers
bot.onText(/\/help/, handleHelp);
bot.onText(/\/snails/, handleSnails);
bot.onText(/\/socials/, handleSocials);
bot.onText(/\/search (.+)/, handleSearch);



// Callback function to handle the selection from the inline keyboard
bot.on('callback_query', async (callbackQuery) => {
  try {
    const userId = callbackQuery.from.id;
    const data = callbackQuery.data;

    if (!data) {
      console.warn('No callback data received');
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'No action specified.' });
      return;
    }

    const [type, queryName, index, initiatorId] = data.split('_');
    if (type !== 'option') {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Invalid action.' });
      return;
    }

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






















