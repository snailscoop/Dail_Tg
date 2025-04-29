/**
 * Moderation Service
 * 
 * This service handles moderation actions like bans and mutes,
 * including consent verification, credential validation, and
 * executing moderation actions through the Telegram bot API.
 */

const gundb = require('../../storage/gundb');
const credentialService = require('./credentialService');
const didMapping = require('./didMapping');
const credentialModels = require('../../cheqd/models/credentials');

let gunInstance = null;
let botInstance = null;

/**
 * Initialize the moderation service
 * @param {Object} bot - Telegram bot instance
 * @param {Object} gun - GunDB instance
 * @returns {Object} The initialized services
 */
function initialize(bot, gun) {
  botInstance = bot;
  gunInstance = gun || credentialService.getGunInstance();
  return { bot: botInstance, gun: gunInstance };
}

/**
 * Get the service instances
 * @returns {Object} The service instances
 */
function getInstances() {
  // First try to get from instanceService if available
  try {
    const instanceService = require('./instanceService');
    const instances = instanceService.getInstances();
    // Update local references if available
    if (instances.gun && !gunInstance) {
      gunInstance = instances.gun;
    }
    if (instances.bot && !botInstance) {
      botInstance = instances.bot;
    }
  } catch (e) {
    // instanceService not available, continue with local references
    console.log('Instance service not available, using local references');
  }

  if (!gunInstance) {
    gunInstance = credentialService.getGunInstance();
  }
  
  return { bot: botInstance, gun: gunInstance };
}

/**
 * Ban a user with consent verification
 * @param {string} moderatorId - Telegram ID of the moderator
 * @param {string} targetUserId - Telegram ID of the target user
 * @param {string} chatId - Chat ID
 * @param {string} reason - Reason for ban
 * @param {Array<string>} consentIds - IDs of consent records (optional)
 * @returns {Promise<Object>} Ban result
 */
async function banUserWithConsent(moderatorId, targetUserId, chatId, reason, consentIds = []) {
  const { bot, gun } = getInstances();
  
  if (!bot) {
    throw new Error('Bot instance not initialized');
  }
  
  // Check if moderator has required credentials
  const hasModeratorCred = await credentialService.userHasModeratorCredential(moderatorId, chatId);
  const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(moderatorId, chatId);
  
  if (!hasModeratorCred && !hasAdminPrivileges) {
    throw new Error('User does not have moderation privileges');
  }
  
  // Get DIDs
  const moderatorDid = await didMapping.getDidForUser(moderatorId);
  
  // Create consent record if none provided
  if (consentIds.length === 0) {
    const consentRecord = await credentialService.recordConsent(
      moderatorId,
      targetUserId,
      `Ban from chat ${chatId} for reason: ${reason}`
    );
    consentIds = [consentRecord.id];
  }
  
  // Create ban record
  const banRecord = credentialModels.createBanRecord(
    targetUserId,
    moderatorDid,
    chatId,
    reason,
    consentIds
  );
  
  // Store ban record
  await gundb.storeBanRecord(
    gun,
    banRecord.id,
    targetUserId,
    moderatorDid,
    chatId,
    reason,
    consentIds
  );
  
  // Execute the ban
  try {
    await bot.banChatMember(chatId, targetUserId, {
      until_date: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    });
    
    // Check if this chat is participating in cross-chat bans
    const isParticipating = await isChatParticipatingInCrossBans(chatId);
    if (isParticipating) {
      // Add to cross-chat ban registry
      await addToCrossChatBanRegistry(targetUserId, reason, banRecord.id, moderatorDid);
    }
    
    return {
      success: true,
      banRecord,
      action: 'ban',
    };
  } catch (error) {
    console.error('Error executing ban:', error);
    
    return {
      success: false,
      error: error.message,
      action: 'ban',
    };
  }
}

/**
 * Mute a user with consent verification
 * @param {string} moderatorId - Telegram ID of the moderator
 * @param {string} targetUserId - Telegram ID of the target user
 * @param {string} chatId - Chat ID
 * @param {string} reason - Reason for mute
 * @param {number} durationSeconds - Duration of mute in seconds
 * @returns {Promise<Object>} Mute result
 */
async function muteUserWithConsent(moderatorId, targetUserId, chatId, reason, durationSeconds = 3600) {
  const { bot, gun } = getInstances();
  
  if (!bot) {
    throw new Error('Bot instance not initialized');
  }
  
  // Check if moderator has required credentials
  const hasModeratorCred = await credentialService.userHasModeratorCredential(moderatorId, chatId);
  const hasAdminPrivileges = await credentialService.userHasAdminPrivileges(moderatorId, chatId);
  
  if (!hasModeratorCred && !hasAdminPrivileges) {
    throw new Error('User does not have moderation privileges');
  }
  
  // Create consent record
  const consentRecord = await credentialService.recordConsent(
    moderatorId,
    targetUserId,
    `Mute in chat ${chatId} for reason: ${reason}`
  );
  
  // Execute the mute
  try {
    const untilDate = Math.floor(Date.now() / 1000) + durationSeconds;
    
    await bot.restrictChatMember(chatId, targetUserId, {
      until_date: untilDate,
      permissions: {
        can_send_messages: false,
        can_send_media_messages: false,
        can_send_polls: false,
        can_send_other_messages: false,
        can_add_web_page_previews: false,
      },
    });
    
    return {
      success: true,
      consentId: consentRecord.id,
      action: 'mute',
      duration: durationSeconds,
      untilDate,
    };
  } catch (error) {
    console.error('Error executing mute:', error);
    
    return {
      success: false,
      error: error.message,
      action: 'mute',
    };
  }
}

/**
 * Check if a user is banned
 * @param {string} userId - Telegram user ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Whether user is banned
 */
async function isUserBanned(userId, chatId) {
  const { gun } = getInstances();
  return gundb.isUserBanned(gun, userId, chatId);
}

/**
 * Get ban records for a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<Array>} Ban records
 */
function getBanRecordsForChat(chatId) {
  const { gun } = getInstances();
  
  return new Promise((resolve) => {
    const banRecords = [];
    
    gun.get('bans_by_chat')
      .get(chatId)
      .map()
      .once((data, key) => {
        gun.get('bans').get(key).once((banData) => {
          if (banData) {
            banRecords.push(banData);
          }
        });
      });
    
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(banRecords);
    }, 1000);
  });
}

/**
 * Get ban records for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Ban records
 */
function getBanRecordsForUser(userId) {
  const { gun } = getInstances();
  
  return new Promise((resolve) => {
    const banRecords = [];
    
    gun.get('bans_by_user')
      .get(userId)
      .map()
      .once((data, key) => {
        gun.get('bans').get(key).once((banData) => {
          if (banData) {
            banRecords.push(banData);
          }
        });
      });
    
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(banRecords);
    }, 1000);
  });
}

/**
 * Check cross-chat ban registry for a user
 * @param {string} userId - User ID to check
 * @returns {Promise<Array>} Cross-chat ban records for the user
 */
async function checkCrossChatBans(userId) {
  const { gun } = getInstances();
  
  return new Promise((resolve) => {
    const crossBanRecords = [];
    
    gun.get('cross_chat_bans')
      .get(userId)
      .once((data) => {
        if (data) {
          crossBanRecords.push(data);
        }
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(crossBanRecords);
    }, 1000);
  });
}

/**
 * Add a user to the cross-chat ban registry
 * @param {string} userId - User ID to ban
 * @param {string} reason - Reason for the ban
 * @param {string} banId - Original ban record ID
 * @param {string} moderatorDid - DID of the moderator who performed the ban
 * @returns {Promise<Object>} The cross-chat ban record
 */
async function addToCrossChatBanRegistry(userId, reason, banId, moderatorDid) {
  const { gun } = getInstances();
  
  return new Promise((resolve, reject) => {
    const crossBanRecord = {
      userId,
      reason,
      originalBanId: banId,
      bannedBy: moderatorDid,
      timestamp: Date.now(),
    };
    
    gun.get('cross_chat_bans')
      .get(userId)
      .put(crossBanRecord, (ack) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          resolve(crossBanRecord);
        }
      });
  });
}

/**
 * Set a chat's participation in the cross-chat ban system
 * @param {string} chatId - Chat ID
 * @param {boolean} optIn - Whether to opt in (true) or opt out (false)
 * @returns {Promise<Object>} The participation record
 */
async function setCrossChatBanParticipation(chatId, optIn) {
  const { gun } = getInstances();
  
  return new Promise((resolve, reject) => {
    const participationRecord = {
      chatId,
      participating: optIn,
      timestamp: Date.now(),
    };
    
    gun.get('cross_chat_participation')
      .get(chatId)
      .put(participationRecord, (ack) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          resolve(participationRecord);
        }
      });
  });
}

/**
 * Check if a chat is participating in the cross-chat ban system
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Whether the chat is participating
 */
async function isChatParticipatingInCrossBans(chatId) {
  const { gun } = getInstances();
  
  return new Promise((resolve) => {
    gun.get('cross_chat_participation')
      .get(chatId)
      .once((data) => {
        if (data && data.participating === true) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
  });
}

/**
 * Get all chats participating in the cross-chat ban system
 * @returns {Promise<Array>} Array of participating chat IDs
 */
async function getParticipatingChats() {
  const { gun } = getInstances();
  
  return new Promise((resolve) => {
    const participatingChats = [];
    
    gun.get('cross_chat_participation')
      .map()
      .once((data, key) => {
        if (data && data.participating === true) {
          participatingChats.push(key);
        }
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(participatingChats);
    }, 1000);
  });
}

/**
 * Check if a user is banned in any participating chats
 * @param {string} userId - User ID to check
 * @returns {Promise<Object|null>} Cross-chat ban record or null if not banned
 */
async function isUserCrossChatBanned(userId) {
  const crossBanRecords = await checkCrossChatBans(userId);
  
  if (crossBanRecords.length > 0) {
    // User is banned in the cross-chat system
    return crossBanRecords[0]; // Return the first record
  }
  
  return null;
}

module.exports = {
  initialize,
  getInstances,
  banUserWithConsent,
  muteUserWithConsent,
  isUserBanned,
  getBanRecordsForChat,
  getBanRecordsForUser,
  checkCrossChatBans,
  addToCrossChatBanRegistry,
  setCrossChatBanParticipation,
  isChatParticipatingInCrossBans,
  getParticipatingChats,
  isUserCrossChatBanned
}; 