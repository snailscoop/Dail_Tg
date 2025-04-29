const Gun = require('gun');
require('gun/sea');
const config = require('../cheqd/config');

/**
 * Initialize GunDB with peers
 * @param {boolean} isMasterNode - Whether this is the master node or a peer
 * @returns {Object} GunDB instance
 */
function initGunDB(isMasterNode = false) {
  // Configuration for GunDB
  const gunConfig = {
    peers: config.gundb?.peers || ['http://localhost:3000/gun'],
    radisk: true,  // Persist data to disk
    file: 'gundb',  // Storage location
  };
  
  // Add web server for master node
  if (isMasterNode) {
    const server = require('http').createServer().listen(config.gundb?.port || 3000);
    gunConfig.web = server;
    console.log(`GunDB master node running on port ${config.gundb?.port || 3000}`);
  } else {
    // For bot peers, we want to optimize for local-first operations
    gunConfig.localStorage = false;  // Don't use browser localStorage
  }
  
  const gun = Gun(gunConfig);
  
  // Add some basic error handlers
  gun.on('error', (err) => {
    console.error('GunDB error:', err);
  });
  
  // Log connection status
  if (!isMasterNode && gunConfig.peers.length > 0) {
    gunConfig.peers.forEach(peer => {
      console.log(`GunDB attempting to connect to peer: ${peer}`);
    });
  }
  
  return gun;
}

/**
 * Initialize master node
 * @returns {Object} GunDB master node instance
 */
function initMasterNode() {
  return initGunDB(true);
}

/**
 * Initialize bot peer node
 * @returns {Object} GunDB bot peer instance
 */
function initBotNode() {
  return initGunDB(false);
}

/**
 * Store credential reference in GunDB
 * @param {Object} gun - GunDB instance
 * @param {string} credentialId - Credential ID
 * @param {string} issuerDid - Issuer DID
 * @param {string} subjectDid - Subject DID
 * @param {Object} metadata - Credential metadata
 * @returns {Promise<Object>} Stored credential reference
 */
function storeCredential(gun, credentialId, issuerDid, subjectDid, metadata) {
  return new Promise((resolve, reject) => {
    // Process metadata to ensure it's GunDB friendly
    let processedMetadata = {};
    
    // Convert arrays to strings and flatten objects
    Object.keys(metadata).forEach(key => {
      const value = metadata[key];
      if (Array.isArray(value)) {
        processedMetadata[key] = value.join(',');
      } else if (typeof value === 'object' && value !== null) {
        // Flatten nested objects
        Object.keys(value).forEach(nestedKey => {
          processedMetadata[`${key}_${nestedKey}`] = value[nestedKey];
        });
      } else {
        processedMetadata[key] = value;
      }
    });
    
    const credentialRef = {
      id: credentialId,
      issuer: issuerDid,
      subject: subjectDid,
      type: Array.isArray(metadata.type) ? metadata.type.join(',') : metadata.type,
      timestamp: Date.now(),
      metadata: processedMetadata
    };
    
    // Store in local cache first for immediate access
    gun.get('credentials')
      .get(credentialId)
      .put(credentialRef, (ack) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          // Also index by subject for faster lookup
          gun.get('credentials_by_subject')
            .get(subjectDid)
            .set(gun.get('credentials').get(credentialId));
            
          resolve(credentialRef);
        }
      });
  });
}

/**
 * Store consent record in GunDB
 * @param {Object} gun - GunDB instance
 * @param {string} consentId - Consent ID
 * @param {string} issuerDid - Issuer DID
 * @param {string} subjectDid - Subject DID
 * @param {string} purpose - Purpose of consent
 * @param {string} expiryDate - Expiry date of consent
 * @returns {Promise<Object>} Stored consent record
 */
function storeConsentRecord(gun, consentId, issuerDid, subjectDid, purpose, expiryDate) {
  return new Promise((resolve, reject) => {
    const consentRecord = {
      id: consentId,
      issuer: issuerDid,
      subject: subjectDid,
      purpose,
      granted: true,
      timestamp: Date.now(),
      expiry: expiryDate || null,
    };
    
    gun.get('consent')
      .get(consentId)
      .put(consentRecord, (ack) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          // Also index by subject
          gun.get('consent_by_subject')
            .get(subjectDid)
            .set(gun.get('consent').get(consentId));
            
          resolve(consentRecord);
        }
      });
  });
}

/**
 * Get credential from GunDB
 * @param {Object} gun - GunDB instance
 * @param {string} credentialId - Credential ID
 * @returns {Promise<Object>} Credential
 */
function getCredential(gun, credentialId) {
  return new Promise((resolve, reject) => {
    gun.get('credentials')
      .get(credentialId)
      .once((data) => {
        if (data) {
          resolve(data);
        } else {
          reject(new Error('Credential not found'));
        }
      });
  });
}

/**
 * Check if user has valid moderator credential
 * @param {Object} gun - GunDB instance
 * @param {string} userDid - User DID
 * @returns {Promise<boolean>} Whether user has moderator credential
 */
function hasModeratorCredential(gun, userDid) {
  return new Promise((resolve) => {
    const credentials = [];
    
    // Use the index for faster lookup
    gun.get('credentials_by_subject')
      .get(userDid)
      .map()
      .once((data, key) => {
        // Load the full credential data
        gun.get('credentials').get(key).once((credData) => {
          if (credData && 
              credData.metadata && 
              credData.metadata.type && 
              credData.metadata.type.includes('ModeratorCredential')) {
            credentials.push(credData);
          }
        });
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(credentials.length > 0);
    }, 1000);
  });
}

/**
 * Store ban record in GunDB
 * @param {Object} gun - GunDB instance
 * @param {string} banId - Ban ID
 * @param {string} targetUser - Target user ID
 * @param {string} bannedBy - DID of user who banned
 * @param {string} chatId - Chat ID
 * @param {string} reason - Reason for ban
 * @param {Array<string>} consentIds - IDs of consent records
 * @returns {Promise<Object>} Stored ban record
 */
function storeBanRecord(gun, banId, targetUser, bannedBy, chatId, reason, consentIds) {
  return new Promise((resolve, reject) => {
    const banRecord = {
      id: banId,
      targetUser,
      bannedBy,
      chatId,
      reason,
      timestamp: Date.now(),
      consentIds: consentIds || [],
    };
    
    gun.get('bans')
      .get(banId)
      .put(banRecord, (ack) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          // Index bans by chat
          gun.get('bans_by_chat')
            .get(chatId)
            .set(gun.get('bans').get(banId));
            
          // Index bans by target user
          gun.get('bans_by_user')
            .get(targetUser)
            .set(gun.get('bans').get(banId));
            
          resolve(banRecord);
        }
      });
  });
}

/**
 * Check if user is banned in chat
 * @param {Object} gun - GunDB instance
 * @param {string} userId - User ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Whether user is banned
 */
function isUserBanned(gun, userId, chatId) {
  return new Promise((resolve) => {
    const bans = [];
    
    gun.get('bans_by_user')
      .get(userId)
      .map()
      .once((data, key) => {
        gun.get('bans').get(key).once((banData) => {
          if (banData && banData.chatId === chatId) {
            bans.push(banData);
          }
        });
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(bans.length > 0);
    }, 1000);
  });
}

/**
 * Store a trusted member in GunDB
 * @param {Object} gun - GunDB instance
 * @param {string} userId - User ID 
 * @param {string} username - Username
 * @param {string} chatId - Chat ID
 * @param {string} addedBy - User ID who added them
 * @returns {Promise<Object>} Stored trusted member record
 */
function storeTrustedMember(gun, userId, username, chatId, addedBy) {
  return new Promise((resolve, reject) => {
    const trustedRecord = {
      userId,
      username,
      chatId,
      addedBy,
      timestamp: Date.now(),
    };
    
    // Generate a unique record ID
    const recordId = `trusted_${chatId}_${userId}`;
    
    gun.get('trusted_members')
      .get(recordId)
      .put(trustedRecord, (ack) => {
        if (ack.err) {
          reject(ack.err);
        } else {
          // Index trusted members by chat
          gun.get('trusted_by_chat')
            .get(chatId)
            .set(gun.get('trusted_members').get(recordId));
            
          // Index trusted members by user ID
          gun.get('trusted_by_user')
            .get(userId)
            .set(gun.get('trusted_members').get(recordId));
            
          resolve(trustedRecord);
        }
      });
  });
}

/**
 * Check if user is a trusted member in a chat
 * @param {Object} gun - GunDB instance
 * @param {string} userId - User ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Whether user is a trusted member
 */
function isUserTrusted(gun, userId, chatId) {
  console.log(`[DEBUG] isUserTrusted checking userId: ${userId}, chatId: ${chatId}`);
  console.log(`[DEBUG] isUserTrusted checking for record with ID format: trusted_${chatId}_${userId}`);
  
  return new Promise((resolve) => {
    let found = false;
    let checkCount = 0;
    let directCheckDone = false;
    
    // First try direct lookup by expectedId
    const expectedId = `trusted_${chatId}_${userId}`;
    console.log(`[DEBUG] isUserTrusted trying direct lookup with ID: ${expectedId}`);
    
    gun.get('trusted_members').get(expectedId).once((directRecord) => {
      console.log(`[DEBUG] isUserTrusted direct lookup result:`, JSON.stringify(directRecord));
      if (directRecord && directRecord.chatId == chatId) {
        console.log(`[DEBUG] isUserTrusted found record directly!`);
        found = true;
        directCheckDone = true;
        // Immediately resolve if found
        console.log(`[DEBUG] isUserTrusted resolving with found: ${found} (direct lookup)`);
        resolve(true);
        return;
      }
      directCheckDone = true;
    });
    
    // Also try via the index
    gun.get('trusted_by_user')
      .get(userId)
      .map()
      .once((data, key) => {
        checkCount++;
        console.log(`[DEBUG] isUserTrusted found key: ${key} for userId: ${userId}`);
        
        gun.get('trusted_members').get(key).once((record) => {
          console.log(`[DEBUG] isUserTrusted record data:`, JSON.stringify(record));
          
          if (record) {
            console.log(`[DEBUG] isUserTrusted comparing chatIds - record.chatId: ${record.chatId}, chatId: ${chatId}`);
            
            if (record.chatId == chatId) { // Use == for string/number comparison
              console.log(`[DEBUG] isUserTrusted found matching chatId in index!`);
              found = true;
              // Immediately resolve if found
              console.log(`[DEBUG] isUserTrusted resolving with found: ${found} (index lookup)`);
              resolve(true);
              return;
            }
          }
        });
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      console.log(`[DEBUG] isUserTrusted timeout reached, found: ${found}, checkCount: ${checkCount}, directCheckDone: ${directCheckDone}`);
      
      // Only resolve if we haven't already resolved
      console.log(`[DEBUG] isUserTrusted resolving with found: ${found} (timeout)`);
      resolve(found);
    }, 2000);  // Increased timeout to match userHasModeratorCredential
  });
}

/**
 * Get all trusted members for a chat
 * @param {Object} gun - GunDB instance
 * @param {string} chatId - Chat ID
 * @returns {Promise<Array>} List of trusted members
 */
function getTrustedMembersForChat(gun, chatId) {
  console.log(`[DEBUG] getTrustedMembersForChat checking chatId: ${chatId}`);
  
  return new Promise((resolve) => {
    const trustedMembers = [];
    let checkCount = 0;
    
    gun.get('trusted_by_chat')
      .get(chatId)
      .map()
      .once((data, key) => {
        checkCount++;
        console.log(`[DEBUG] getTrustedMembersForChat found key: ${key} for chatId: ${chatId}`);
        
        gun.get('trusted_members').get(key).once((record) => {
          console.log(`[DEBUG] getTrustedMembersForChat record data:`, JSON.stringify(record));
          
          if (record) {
            trustedMembers.push(record);
          }
        });
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      console.log(`[DEBUG] getTrustedMembersForChat found ${trustedMembers.length} members, checkCount: ${checkCount}`);
      resolve(trustedMembers);
    }, 2000);
  });
}

/**
 * Remove a trusted member
 * @param {Object} gun - GunDB instance
 * @param {string} userId - User ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Whether removal was successful
 */
function removeTrustedMember(gun, userId, chatId) {
  return new Promise((resolve) => {
    const recordId = `trusted_${chatId}_${userId}`;
    
    gun.get('trusted_members')
      .get(recordId)
      .put(null, (ack) => {
        resolve(!ack.err);
      });
  });
}

module.exports = {
  initGunDB,
  initMasterNode,
  initBotNode,
  storeCredential,
  storeConsentRecord,
  getCredential,
  hasModeratorCredential,
  storeBanRecord,
  isUserBanned,
  storeTrustedMember,
  isUserTrusted,
  getTrustedMembersForChat,
  removeTrustedMember
}; 