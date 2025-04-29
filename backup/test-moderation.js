const moderationCommands = require('./telegram/commands/moderationCommands');
const moderationService = require('./telegram/services/moderationService');
const gundb = require('./storage/gundb');
const { getInstances, initializeInstances } = require('./telegram/services/instanceService');

// Mock Telegram bot
const mockBot = {
  messages: [],
  deletedMessages: [],
  restrictions: [],
  chatAdmins: {},
  chatMembers: {},
  bans: [],
  
  // Mock methods
  sendMessage: async (chatId, text) => {
    const msgId = Date.now();
    console.log(`[MOCK] Bot sent message to ${chatId}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    mockBot.messages.push({ chatId, text, message_id: msgId });
    return { message_id: msgId, chat: { id: chatId }, text };
  },
  
  deleteMessage: async (chatId, messageId) => {
    console.log(`[MOCK] Bot deleted message ${messageId} from chat ${chatId}`);
    mockBot.deletedMessages.push({ chatId, messageId });
    return true;
  },
  
  getChatAdministrators: async (chatId) => {
    if (!mockBot.chatAdmins[chatId]) {
      return [];
    }
    console.log(`[MOCK] Getting admins for chat ${chatId}`);
    return mockBot.chatAdmins[chatId];
  },
  
  getChatMember: async (chatId, userIdOrUsername) => {
    console.log(`[MOCK] Getting chat member: ${userIdOrUsername} from chat ${chatId}`);
    
    // Handle username with @ prefix
    let userId = userIdOrUsername;
    if (typeof userIdOrUsername === 'string' && userIdOrUsername.startsWith('@')) {
      const username = userIdOrUsername.substring(1);
      // Find member by username
      for (const memberId in mockBot.chatMembers[chatId] || {}) {
        if (mockBot.chatMembers[chatId][memberId].user.username === username) {
          userId = memberId;
          break;
        }
      }
    }
    
    if (mockBot.chatMembers[chatId] && mockBot.chatMembers[chatId][userId]) {
      return mockBot.chatMembers[chatId][userId];
    }
    
    throw new Error(`User ${userIdOrUsername} not found in chat ${chatId}`);
  },
  
  restrictChatMember: async (chatId, userId, options) => {
    console.log(`[MOCK] Restricting user ${userId} in chat ${chatId}`);
    mockBot.restrictions.push({ chatId, userId, options });
    return true;
  },
  
  kickChatMember: async (chatId, userId, options) => {
    console.log(`[MOCK] Banning user ${userId} from chat ${chatId}`);
    mockBot.bans.push({ chatId, userId, options });
    mockBot.restrictions.push({ chatId, userId, options, type: 'ban' });
    return true;
  },
  
  banChatMember: async (chatId, userId, options) => {
    // Alias for kickChatMember for newer Telegram Bot API
    return mockBot.kickChatMember(chatId, userId, options);
  },
  
  getUpdates: async () => {
    return [];
  }
};

// Setup mock data
function setupMockData() {
  const chatId = '-1002668658699';
  
  // Set up chat members
  mockBot.chatMembers[chatId] = {
    // Chat owner
    '2041129914': {
      user: {
        id: 2041129914,
        username: 'imasalmon',
        first_name: 'Salmon'
      },
      status: 'creator'
    },
    // Moderator
    '5498994297': {
      user: {
        id: 5498994297,
        username: 'GarthVader1',
        first_name: 'Garth'
      },
      status: 'member'
    },
    // Regular user
    '1234567890': {
      user: {
        id: 1234567890,
        username: 'regularuser',
        first_name: 'Regular'
      },
      status: 'member'
    }
  };
  
  // Set up chat admins
  mockBot.chatAdmins[chatId] = [
    {
      user: {
        id: 2041129914,
        username: 'imasalmon',
        first_name: 'Salmon'
      },
      status: 'creator',
      is_anonymous: false,
      can_manage_chat: true
    }
  ];
}

// Create mock message
function createMockMessage(fromUserId, fromUsername, chatId, text, replyToMessage = null) {
  return {
    message_id: Date.now(),
    from: {
      id: fromUserId,
      username: fromUsername,
      first_name: fromUsername
    },
    chat: {
      id: chatId,
      type: 'supergroup'
    },
    text: text,
    reply_to_message: replyToMessage,
    date: Math.floor(Date.now() / 1000)
  };
}

// Initialize GunDB and services
async function initializeTestEnvironment() {
  console.log('Initializing test environment...');
  
  // Initialize GunDB
  const gun = gundb.initBotNode();
  
  // Register our mock bot with the instance service
  initializeInstances({ bot: mockBot, gun });
  
  // Setup mock data
  setupMockData();
  
  // Override GunDB functions with our mock implementations
  const originalGetTrustedMembers = gundb.getTrustedMembersForChat;
  
  // Override getTrustedMembersForChat to return our mock data
  gundb.getTrustedMembersForChat = async (gun, chatId) => {
    console.log(`[MOCK] Getting trusted members for chat ${chatId}`);
    
    // Build our mock trusted members list based on what we know
    const trustedMembers = [];
    
    // Add regularuser if we've trusted them in this test run
    if (await gundb.isUserTrusted(gun, '1234567890', chatId)) {
      trustedMembers.push({
        userId: '1234567890',
        username: 'regularuser',
        chatId: chatId,
        addedBy: '2041129914',
        timestamp: Date.now() - 1000
      });
    }
    
    // Add GarthVader1 as a trusted mod
    trustedMembers.push({
      userId: '5498994297',
      username: 'GarthVader1',
      chatId: chatId,
      addedBy: '2041129914',
      timestamp: Date.now() - 2000
    });
    
    console.log(`[MOCK] Returning ${trustedMembers.length} trusted members for chat ${chatId}`);
    
    return trustedMembers;
  };
  
  // Store the original function to restore it after tests
  gun.originalGetTrustedMembers = originalGetTrustedMembers;
  
  return { gun };
}

// Test functions
async function testTrustUser() {
  console.log('\n===== Testing /trust command =====');
  
  // Create mock message for imasalmon (owner) trusting regularuser
  const chatId = '-1002668658699';
  const msg = createMockMessage(2041129914, 'imasalmon', chatId, '/trust @regularuser');
  
  // Call the handler
  await moderationCommands.handleTrustUserCommand(mockBot, msg, ['regularuser']);
  
  // Check if regularuser is now trusted
  const gun = gundb.initBotNode();
  const isTrusted = await gundb.isUserTrusted(gun, '1234567890', chatId);
  console.log(`User regularuser is trusted: ${isTrusted}`);
}

async function testMuteCommandAsOwner() {
  console.log('\n===== Testing /mute command as owner =====');
  
  // Create mock message for imasalmon (owner) muting regularuser
  const chatId = '-1002668658699';
  const msg = createMockMessage(2041129914, 'imasalmon', chatId, '/mute @regularuser Spamming');
  
  // Call the handler
  await moderationCommands.handleMuteCommand(mockBot, msg, ['regularuser', 'Spamming']);
  
  // Check if regularuser was muted
  console.log(`User regularuser mute attempts: ${mockBot.restrictions.length}`);
}

async function testMuteCommandAsModerator() {
  console.log('\n===== Testing /mute command as moderator =====');
  
  // First ensure GarthVader1 has moderator credential
  const gun = gundb.initBotNode();
  const chatId = '-1002668658699';
  
  // Create mock message for GarthVader1 (moderator) muting regularuser
  const msg = createMockMessage(5498994297, 'GarthVader1', chatId, '/mute @regularuser Spamming');
  
  // Call the handler
  await moderationCommands.handleMuteCommand(mockBot, msg, ['regularuser', 'Spamming']);
  
  // Check if regularuser was muted
  console.log(`Total mute attempts after moderator: ${mockBot.restrictions.length}`);
}

async function testMuteCommandAgainstOwner() {
  console.log('\n===== Testing /mute command against owner =====');
  
  // Create mock message for GarthVader1 (moderator) attempting to mute imasalmon (owner)
  const chatId = '-1002668658699';
  const msg = createMockMessage(5498994297, 'GarthVader1', chatId, '/mute @imasalmon Testing');
  
  // Call the handler
  await moderationCommands.handleMuteCommand(mockBot, msg, ['imasalmon', 'Testing']);
  
  // This should fail because owners can't be muted
  console.log(`Total mute attempts after attempting to mute owner: ${mockBot.restrictions.length}`);
}

async function testBanCommand() {
  console.log('\n===== Testing /ban command =====');
  
  // Create mock message for GarthVader1 (moderator) banning regularuser
  const chatId = '-1002668658699';
  const msg = createMockMessage(5498994297, 'GarthVader1', chatId, '/ban @regularuser Violating rules');
  
  // Store initial ban count
  const initialBans = mockBot.restrictions.length;
  
  // Call the handler
  await moderationCommands.handleBanCommand(mockBot, msg, ['regularuser', 'Violating', 'rules']);
  
  // Check if regularuser was banned
  console.log(`Bans executed: ${mockBot.restrictions.length - initialBans}`);
}

async function testBanCommandAgainstOwner() {
  console.log('\n===== Testing /ban command against owner =====');
  
  // Create mock message for GarthVader1 (moderator) attempting to ban imasalmon (owner)
  const chatId = '-1002668658699';
  const msg = createMockMessage(5498994297, 'GarthVader1', chatId, '/ban @imasalmon Testing');
  
  // Store initial ban count
  const initialBans = mockBot.restrictions.length;
  
  // Call the handler
  await moderationCommands.handleBanCommand(mockBot, msg, ['imasalmon', 'Testing']);
  
  // This should fail because owners can't be banned
  console.log(`Bans executed against owner: ${mockBot.restrictions.length - initialBans}`);
}

async function testTrustedList() {
  console.log('\n===== Testing /trustedlist command =====');
  
  // Create mock message for requesting trusted list
  const chatId = '-1002668658699';
  const msg = createMockMessage(2041129914, 'imasalmon', chatId, '/trustedlist');
  
  // Call the handler
  await moderationCommands.handleTrustedListCommand(mockBot, msg);
  
  // Last message should contain trusted list
  if (mockBot.messages.length > 0) {
    const lastMessage = mockBot.messages[mockBot.messages.length - 1];
    console.log(`Trusted list message: ${lastMessage.text.substring(0, 70)}...`);
  }
}

// Run the tests
async function runTests() {
  try {
    await initializeTestEnvironment();
    
    console.log('\n========== STARTING MODERATION TESTS ==========\n');
    
    // Test trust functionality
    await testTrustUser();
    
    // Test mute functionality
    await testMuteCommandAsOwner();
    await testMuteCommandAsModerator();
    await testMuteCommandAgainstOwner();
    
    // Test ban functionality
    await testBanCommand();
    await testBanCommandAgainstOwner();
    
    // Test trusted list
    await testTrustedList();
    
    console.log('\n========== TEST SUMMARY ==========');
    console.log(`Total messages sent: ${mockBot.messages.length}`);
    console.log(`Total mute/ban restrictions: ${mockBot.restrictions.length}`);
    
  } catch (error) {
    console.error('Error in tests:', error);
  } finally {
    // Wait 2 seconds to allow async operations to complete
    setTimeout(() => {
      console.log('\nTests completed. Exiting...');
      process.exit(0);
    }, 2000);
  }
}

// Run the tests
runTests(); 