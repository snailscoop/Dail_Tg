/**
 * Credential Service
 * 
 * This service manages the issuance and verification of credentials,
 * as well as the storage of consent records. It provides methods for
 * issuing moderator credentials, checking if a user has moderation
 * privileges, and managing consent for moderation actions.
 */

const gundb = require('../../storage/gundb');
const cheqdApi = require('../../cheqd/api');
const didMapping = require('./didMapping');
const credentialModels = require('../../cheqd/models/credentials');

let gunInstance = null;

/**
 * Initialize the credential service
 * @param {Object} gun - GunDB instance
 * @returns {Object} The initialized gun instance
 */
function initialize(gun) {
  gunInstance = gun || didMapping.getGunInstance();
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
 * Issue a moderator credential to a user
 * @param {string} issuerUserId - Telegram ID of the issuer
 * @param {string} subjectUserId - Telegram ID of the subject
 * @param {string} chatId - Chat ID for which moderation is granted
 * @param {Object} permissions - Moderation permissions
 * @returns {Promise<Object>} The issued credential
 */
async function issueModeratorCredential(issuerUserId, subjectUserId, chatId, permissions) {
  // Ensure both users have DIDs
  const issuerDid = await didMapping.ensureUserHasDid(issuerUserId);
  const subjectDid = await didMapping.ensureUserHasDid(subjectUserId);
  
  // Create credential data
  const credentialData = credentialModels.createModeratorCredentialData(
    chatId,
    permissions
  );
  
  // Issue credential
  const credential = await cheqdApi.issueCredential(
    issuerDid,
    subjectDid,
    credentialData
  );
  
  // Store credential in GunDB with simple metadata
  const gun = getGunInstance();
  await gundb.storeCredential(
    gun,
    credential.id || credential.proof.jwt,
    issuerDid,
    subjectDid,
    {
      type: 'ModeratorCredential',
      chatId: chatId.toString(),
      canBan: permissions.canBan || false,
      canMute: permissions.canMute || false,
      canDelete: permissions.canDelete || false, 
      canDeleteMedia: permissions.canDeleteMedia || false,
      canIssueWarnings: permissions.canIssueWarnings || false
    }
  );
  
  return credential;
}

/**
 * Issue an admin credential to a user
 * @param {string} issuerUserId - Telegram ID of the issuer
 * @param {string} subjectUserId - Telegram ID of the subject
 * @param {string} chatId - Chat ID for which admin access is granted
 * @returns {Promise<Object>} The issued credential
 */
async function issueAdminCredential(issuerUserId, subjectUserId, chatId) {
  // Ensure both users have DIDs
  const issuerDid = await didMapping.ensureUserHasDid(issuerUserId);
  const subjectDid = await didMapping.ensureUserHasDid(subjectUserId);
  
  // Create credential data
  const credentialData = credentialModels.createAdminCredentialData(chatId);
  
  // Issue credential
  const credential = await cheqdApi.issueCredential(
    issuerDid,
    subjectDid,
    credentialData
  );
  
  // Store credential in GunDB with simple metadata
  const gun = getGunInstance();
  await gundb.storeCredential(
    gun,
    credential.id || credential.proof.jwt,
    issuerDid,
    subjectDid,
    {
      type: 'AdminCredential',
      chatId: chatId.toString(),
      canBan: true,
      canMute: true,
      canDelete: true,
      canIssueWarnings: true,
      canIssueCredentials: true,
      canRevokeCredentials: true
    }
  );
  
  return credential;
}

/**
 * Check if a user has moderator credentials for a chat
 * @param {string} userId - Telegram user ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Whether user has moderator credentials
 */
async function userHasModeratorCredential(userId, chatId) {
  // Convert IDs to strings for consistency
  userId = String(userId);
  chatId = String(chatId);
  
  console.log(`[DEBUG] userHasModeratorCredential checking userId: ${userId}, chatId: ${chatId}`);
  
  // Get user's DID
  const userDid = await didMapping.getDidForUser(userId);
  console.log(`[DEBUG] userHasModeratorCredential found DID: ${userDid}`);
  
  if (!userDid) {
    console.log(`[DEBUG] userHasModeratorCredential - No DID found for userId: ${userId}`);
    return false;
  }
  
  // Check if user has moderator credential
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    let foundModeratorCredential = false;
    let checkCount = 0;
    
    gun.get('credentials_by_subject')
      .get(userDid)
      .map()
      .once((data, key) => {
        checkCount++;
        console.log(`[DEBUG] userHasModeratorCredential found credential key: ${key} for DID: ${userDid}`);
        
        // Fix for GunDB reference paths
        gun.get('credentials').get(key.split('/')[1]).once((credData) => {
          console.log(`[DEBUG] userHasModeratorCredential credential data:`, JSON.stringify(credData));
          
          if (credData) {
            // First check the root-level type
            const hasRootType = credData.type && 
                               credData.type.includes('ModeratorCredential');
            console.log(`[DEBUG] userHasModeratorCredential hasRootType: ${hasRootType}`);
                
            if (hasRootType && credData.metadata && 
                typeof credData.metadata === 'object' && 
                credData.metadata['#']) {
              
              // Get the metadata using the reference path
              gun.get(credData.metadata['#']).once((metadata) => {
                console.log(`[DEBUG] userHasModeratorCredential metadata:`, JSON.stringify(metadata));
                console.log(`[DEBUG] userHasModeratorCredential comparing chatIds - metadata.chatId: ${metadata && metadata.chatId}, chatId: ${chatId}`);
                
                if (metadata && metadata.chatId === chatId) {
                  console.log(`[DEBUG] userHasModeratorCredential found matching chatId!`);
                  foundModeratorCredential = true;
                  resolve(true);
                }
              });
            }
          }
        });
      });
    
    // Fallback timeout in case we don't get all the callbacks
    setTimeout(() => {
      console.log(`[DEBUG] userHasModeratorCredential timeout reached, foundModeratorCredential: ${foundModeratorCredential}, checkCount: ${checkCount}`);
      if (!foundModeratorCredential) {
        resolve(false);
      }
    }, 2000);
  });
}

/**
 * Get all moderator credentials for a user
 * @param {string} userId - Telegram user ID
 * @returns {Promise<Array>} List of moderator credentials
 */
async function getModeratorCredentials(userId) {
  // Get user's DID
  const userDid = await didMapping.getDidForUser(userId);
  if (!userDid) {
    return [];
  }
  
  // Get all moderator credentials
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    const credentials = [];
    let pendingChecks = 0;
    
    gun.get('credentials_by_subject')
      .get(userDid)
      .map()
      .once((data, key) => {
        pendingChecks++;
        
        // Fix for GunDB reference paths
        gun.get('credentials').get(key.split('/')[1]).once((credData) => {
          if (credData) {
            // Check root level type
            const hasRootType = credData.type && 
                               credData.type.includes('ModeratorCredential');
            
            if (hasRootType && credData.metadata && 
                typeof credData.metadata === 'object' && 
                credData.metadata['#']) {
              
              // Get the metadata using the reference path
              gun.get(credData.metadata['#']).once((metadata) => {
                if (metadata) {
                  // Add the credential with its metadata
                  credentials.push({
                    ...credData,
                    metadata: metadata
                  });
                }
                
                pendingChecks--;
                if (pendingChecks === 0) {
                  resolve(credentials);
                }
              });
            } else {
              pendingChecks--;
              if (pendingChecks === 0) {
                resolve(credentials);
              }
            }
          } else {
            pendingChecks--;
            if (pendingChecks === 0) {
              resolve(credentials);
            }
          }
        });
      });
    
    // Fallback timeout in case we don't get all the callbacks
    setTimeout(() => {
      resolve(credentials);
    }, 2000);
  });
}

/**
 * Record consent for a moderation action
 * @param {string} issuerUserId - Telegram ID of the consent issuer
 * @param {string} subjectUserId - Telegram ID of the subject (target)
 * @param {string} purpose - Purpose of consent
 * @returns {Promise<Object>} The consent record
 */
async function recordConsent(issuerUserId, subjectUserId, purpose) {
  // Ensure both users have DIDs
  const issuerDid = await didMapping.ensureUserHasDid(issuerUserId);
  const subjectDid = await didMapping.ensureUserHasDid(subjectUserId);
  
  // Create consent record
  const consentRecord = credentialModels.createConsentRecord(
    issuerDid,
    subjectDid,
    purpose
  );
  
  // Store consent in GunDB
  const gun = getGunInstance();
  await gundb.storeConsentRecord(
    gun,
    consentRecord.id,
    issuerDid,
    subjectDid,
    purpose
  );
  
  return consentRecord;
}

/**
 * Get all consent records for a user
 * @param {string} userId - Telegram user ID
 * @returns {Promise<Array>} List of consent records
 */
async function getConsentRecordsForUser(userId) {
  // Get user's DID
  const userDid = await didMapping.getDidForUser(userId);
  if (!userDid) {
    return [];
  }
  
  // Get all consent records
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    const consentRecords = [];
    
    gun.get('consent_by_subject')
      .get(userDid)
      .map()
      .once((data, key) => {
        gun.get('consent').get(key).once((consentData) => {
          if (consentData) {
            consentRecords.push(consentData);
          }
        });
      });
      
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      resolve(consentRecords);
    }, 1000);
  });
}

/**
 * Check if a user has admin privileges
 * @param {string} userId - Telegram user ID
 * @param {string} chatId - Chat ID
 * @returns {Promise<boolean>} Whether user has admin privileges
 */
async function userHasAdminPrivileges(userId, chatId) {
  // Convert IDs to strings for consistency
  userId = String(userId);
  chatId = String(chatId);
  
  console.log(`[DEBUG] userHasAdminPrivileges checking userId: ${userId}, chatId: ${chatId}`);
  
  // Get user's DID
  const userDid = await didMapping.getDidForUser(userId);
  if (!userDid) {
    console.log(`[DEBUG] userHasAdminPrivileges - No DID found for userId: ${userId}`);
    return false;
  }
  
  // Check if user has admin credential
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    let foundAdminCredential = false;
    
    gun.get('credentials_by_subject')
      .get(userDid)
      .map()
      .once((data, key) => {
        // Fix for GunDB reference paths
        gun.get('credentials').get(key.split('/')[1]).once((credData) => {
          if (credData) {
            // First check the root-level type
            const hasRootType = credData.type && 
                               credData.type.includes('AdminCredential');
                
            if (hasRootType && credData.metadata && 
                typeof credData.metadata === 'object' && 
                credData.metadata['#']) {
              
              // Get the metadata using the reference path
              gun.get(credData.metadata['#']).once((metadata) => {
                if (metadata && metadata.chatId === chatId) {
                  foundAdminCredential = true;
                  resolve(true);
                }
              });
            }
          }
        });
      });
    
    // Fallback timeout in case we don't get all the callbacks
    setTimeout(() => {
      if (!foundAdminCredential) {
        resolve(false);
      }
    }, 2000);
  });
}

/**
 * Revoke a credential
 * @param {string} issuerUserId - Telegram ID of the issuer/revoker
 * @param {string} credentialId - ID of the credential to revoke
 * @returns {Promise<Object>} Revocation result
 */
async function revokeCredential(issuerUserId, credentialId) {
  // Get issuer's DID
  const issuerDid = await didMapping.getDidForUser(issuerUserId);
  if (!issuerDid) {
    throw new Error('Issuer DID not found');
  }
  
  // Get the credential
  const gun = getGunInstance();
  
  return new Promise((resolve, reject) => {
    gun.get('credentials').get(credentialId).once(async (credData) => {
      if (!credData) {
        reject(new Error('Credential not found'));
        return;
      }
      
      // Check if the issuer is the same
      if (credData.issuer !== issuerDid) {
        reject(new Error('Only the original issuer can revoke a credential'));
        return;
      }
      
      try {
        // Revoke the credential (mocked in cheqd API)
        await cheqdApi.revokeCredential(credentialId, issuerDid);
        
        // Update credential status in GunDB
        gun.get('credentials').get(credentialId).put({
          ...credData,
          revoked: true,
          revocationDate: Date.now()
        }, (ack) => {
          if (ack.err) {
            reject(ack.err);
          } else {
            resolve({
              success: true,
              credentialId,
              message: 'Credential revoked successfully'
            });
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

/**
 * Verify if a credential is valid and not revoked
 * @param {string} credentialId - ID of the credential to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyCredential(credentialId) {
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    gun.get('credentials').get(credentialId).once(async (credData) => {
      if (!credData) {
        resolve({ verified: false, reason: 'Credential not found' });
        return;
      }
      
      // Check if revoked
      if (credData.revoked) {
        resolve({ 
          verified: false, 
          reason: 'Credential has been revoked',
          revocationDate: credData.revocationDate
        });
        return;
      }
      
      // Verify the credential using cheqd API
      try {
        // In a real implementation, we would verify the credential signature
        // Here we just check if it's in our database and not revoked
        
        // Verify that the credential's subject DID exists
        const subjectDid = credData.subject;
        const subjectExists = await didMapping.didExists(subjectDid);
        
        if (!subjectExists) {
          resolve({ verified: false, reason: 'Subject DID does not exist' });
          return;
        }
        
        // Check if the credential has expired
        if (credData.metadata && credData.metadata.expirationDate) {
          const expiryDate = new Date(credData.metadata.expirationDate);
          if (expiryDate < new Date()) {
            resolve({ verified: false, reason: 'Credential has expired' });
            return;
          }
        }
        
        resolve({ 
          verified: true,
          credentialId,
          credential: credData 
        });
      } catch (error) {
        resolve({ 
          verified: false, 
          reason: error.message 
        });
      }
    });
  });
}

/**
 * Check if a user has a specific permission in their moderator credential
 * @param {string} userId - Telegram user ID
 * @param {string} chatId - Chat ID
 * @param {string} permission - Permission to check (e.g., 'canBan', 'canMute', 'canDeleteMedia')
 * @returns {Promise<boolean>} Whether the user has the permission
 */
async function userHasPermission(userId, chatId, permission) {
  // Ensure user exists
  const userDid = await didMapping.getDidForUser(userId);
  if (!userDid) {
    console.log(`[Debug] No DID found for user: ${userId}`);
    return false;
  }
  
  console.log(`[Debug] Checking permission ${permission} for user with DID: ${userDid} in chat ${chatId}`);
  
  const gun = getGunInstance();
  
  return new Promise((resolve) => {
    let hasPermission = false;
    let checkCount = 0;
    
    gun.get('credentials')
      .map()
      .once((credentialData, key) => {
        if (credentialData && 
            credentialData.subject === userDid && 
            credentialData.type && 
            (credentialData.type === 'ModeratorCredential' || credentialData.type.includes('ModeratorCredential'))) {
          
          checkCount++;
          console.log(`[Debug] Found credential for user: ${key}`);
          
          // Get the metadata which contains permissions
          gun.get('credentials')
            .get(key)
            .get('metadata')
            .once((metadata) => {
              if (metadata && 
                  metadata.chatId && 
                  metadata.chatId.toString() === chatId.toString() &&
                  metadata[permission] === true) {
                
                console.log(`[Debug] Found matching permission ${permission} in chat: ${metadata.chatId}`);
                hasPermission = true;
              }
            });
        }
      });
    
    // Wait a bit for Gun to process the query
    setTimeout(() => {
      console.log(`[Debug] Permission check result for ${permission}: ${hasPermission} (checked ${checkCount} credentials)`);
      resolve(hasPermission);
    }, 2000);
  });
}

module.exports = {
  initialize,
  getGunInstance,
  issueModeratorCredential,
  issueAdminCredential,
  userHasModeratorCredential,
  getModeratorCredentials,
  recordConsent,
  getConsentRecordsForUser,
  userHasAdminPrivileges,
  revokeCredential,
  verifyCredential,
  userHasPermission
}; 