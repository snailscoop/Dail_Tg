/**
 * DID Mapping Service
 * 
 * This service manages the mapping between Telegram user IDs and DIDs.
 * It uses GunDB for storage and provides methods for creating, retrieving,
 * and validating DIDs for Telegram users.
 */

const gundb = require('../../storage/gundb');
const cheqdApi = require('../../cheqd/api');

let gunInstance = null;

/**
 * Initialize the DID mapping service
 * @param {Object} gun - GunDB instance
 * @returns {Object} The initialized gun instance
 */
function initialize(gun) {
  gunInstance = gun || gundb.initBotNode();
  return gunInstance;
}

/**
 * Get the GunDB instance
 * @returns {Object} GunDB instance
 */
function getGunInstance() {
  if (!gunInstance) {
    return initialize();
  }
  return gunInstance;
}

/**
 * Map a Telegram user to a DID
 * @param {string} userId - Telegram user ID
 * @param {string} did - DID to map to
 * @returns {Promise<Object>} The mapping record
 */
function mapUserToDid(userId, did) {
  const gun = getGunInstance();
  
  return new Promise((resolve, reject) => {
    const mappingRecord = {
      userId,
      did,
      timestamp: Date.now(),
    };
    
    gun.get('user_did_mapping')
      .get(userId)
      .put(mappingRecord, (ack) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          // Also create reverse mapping for lookup by DID
          gun.get('did_user_mapping')
            .get(did)
            .put({ userId, timestamp: Date.now() }, (reverseAck) => {
              if (reverseAck.err) {
                console.warn('Error creating reverse DID mapping:', reverseAck.err);
              }
            });
            
          resolve(mappingRecord);
        }
      });
  });
}

/**
 * Get DID for a Telegram user
 * @param {string} userId - Telegram user ID
 * @returns {Promise<string|null>} DID or null if not found
 */
function getDidForUser(userId) {
  const gun = getGunInstance();
  console.log(`[DID Debug] getDidForUser called with userId: ${userId} (type: ${typeof userId})`);
  
  return new Promise((resolve) => {
    gun.get('user_did_mapping')
      .get(userId.toString())
      .once((data) => {
        console.log(`[DID Debug] getDidForUser lookup result for ${userId}:`, data);
        if (data && data.did) {
          console.log(`[DID Debug] Found DID for userId ${userId}: ${data.did}`);
          resolve(data.did);
        } else {
          console.log(`[DID Debug] No DID found for userId ${userId}`);
          resolve(null);
        }
      });
  });
}

/**
 * Get Telegram user ID for a DID
 * @param {string} did - DID to look up
 * @returns {Promise<string|null>} User ID or null if not found
 */
function getUserForDid(did) {
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    gun.get('did_user_mapping')
      .get(did)
      .once((data) => {
        if (data && data.userId) {
          resolve(data.userId);
        } else {
          resolve(null);
        }
      });
  });
}

/**
 * Create a DID for a Telegram user if they don't already have one
 * @param {string} userId - Telegram user ID
 * @param {string} username - Telegram username
 * @returns {Promise<string>} The DID
 */
async function ensureUserHasDid(userId, username) {
  // Check if user already has a DID
  const existingDid = await getDidForUser(userId);
  if (existingDid) {
    return existingDid;
  }
  
  // Create a new DID for the user
  const alias = `telegram-${username || userId}`;
  const didResult = await cheqdApi.createCheqdDID(alias);
  
  // Map the user to the new DID
  await mapUserToDid(userId, didResult.did);
  
  return didResult.did;
}

/**
 * Check if a user has a valid DID
 * @param {string} userId - Telegram user ID
 * @returns {Promise<boolean>} Whether the user has a valid DID
 */
async function userHasValidDid(userId) {
  const did = await getDidForUser(userId);
  return !!did;
}

/**
 * Check if a DID exists
 * @param {string} did - DID to check
 * @returns {Promise<boolean>} Whether the DID exists
 */
async function didExists(did) {
  try {
    // In a real implementation, we would resolve the DID
    // For the mock implementation, we just check if it's in our database
    const userId = await getUserForDid(did);
    return !!userId;
  } catch (error) {
    console.error('Error checking DID existence:', error);
    return false;
  }
}

/**
 * Get all DIDs in the system
 * @returns {Promise<Array>} List of all DIDs
 */
async function getAllDids() {
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    const dids = [];
    
    gun.get('did_user_mapping')
      .map()
      .once((data, key) => {
        dids.push({
          did: key,
          userId: data.userId,
          timestamp: data.timestamp
        });
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(dids);
    }, 1000);
  });
}

/**
 * Get user's DID details including when it was created
 * @param {string} userId - Telegram user ID
 * @returns {Promise<Object|null>} DID details or null if not found
 */
async function getDidDetails(userId) {
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    gun.get('user_did_mapping')
      .get(userId)
      .once(async (data) => {
        if (data && data.did) {
          // In a real implementation, we would get more DID details from the blockchain
          // For the mock, just return what we have
          resolve({
            did: data.did,
            created: new Date(data.timestamp).toISOString(),
            controller: data.did,
            source: 'cheqd mock'
          });
        } else {
          resolve(null);
        }
      });
  });
}

module.exports = {
  initialize,
  getGunInstance,
  mapUserToDid,
  getDidForUser,
  getUserForDid,
  ensureUserHasDid,
  userHasValidDid,
  didExists,
  getAllDids,
  getDidDetails
}; 