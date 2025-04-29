/**
 * Generate a unique ID for a credential or consent record
 * @returns {string} Unique ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

/**
 * Create moderator credential data
 * @param {string} chatId - Chat ID for which moderation is granted
 * @param {Object} permissions - Moderation permissions
 * @param {string} expirationDate - Optional expiration date
 * @returns {Object} Moderator credential data
 */
function createModeratorCredentialData(chatId, permissions, expirationDate) {
  return {
    type: 'moderator',
    chatId,
    permissions: {
      canBan: permissions.canBan || false,
      canMute: permissions.canMute || false,
      canDelete: permissions.canDelete || false,
      canDeleteMedia: permissions.canDeleteMedia || false,
      canIssueWarnings: permissions.canIssueWarnings || false,
      moderationScope: permissions.moderationScope || ['messages', 'users'],
    },
    issuanceDate: new Date().toISOString(),
    expirationDate: expirationDate || null,
  };
}

/**
 * Create consent record data
 * @param {string} issuerDid - Issuer DID
 * @param {string} subjectDid - Subject DID
 * @param {string} purpose - Purpose of consent
 * @param {string} expiryDate - Optional expiry date
 * @returns {Object} Consent record data
 */
function createConsentRecord(issuerDid, subjectDid, purpose, expiryDate) {
  return {
    id: generateId(),
    issuer: issuerDid,
    subject: subjectDid,
    purpose,
    granted: true,
    timestamp: Date.now(),
    expiry: expiryDate || null,
  };
}

/**
 * Create ban record data
 * @param {string} targetUser - Target user ID
 * @param {string} bannedBy - DID of user who banned
 * @param {string} chatId - Chat ID
 * @param {string} reason - Reason for ban
 * @param {Array<string>} consentIds - IDs of consent records
 * @returns {Object} Ban record data
 */
function createBanRecord(targetUser, bannedBy, chatId, reason, consentIds) {
  return {
    id: generateId(),
    targetUser,
    bannedBy,
    chatId,
    reason,
    timestamp: Date.now(),
    consentIds: consentIds || [],
  };
}

/**
 * Create admin credential data
 * @param {string} chatId - Chat ID for which admin access is granted
 * @returns {Object} Admin credential data
 */
function createAdminCredentialData(chatId) {
  return {
    type: 'admin',
    chatId,
    permissions: {
      canBan: true,
      canMute: true,
      canDelete: true,
      canIssueWarnings: true,
      canIssueCredentials: true,
      canRevokeCredentials: true,
      moderationScope: ['all'],
    },
    issuanceDate: new Date().toISOString(),
  };
}

/**
 * Validate a credential
 * @param {Object} credential - Credential to validate
 * @returns {boolean} Whether credential is valid
 */
function isCredentialValid(credential) {
  // Check basic structure
  if (!credential || !credential.credentialSubject) {
    return false;
  }
  
  // Check for expiry
  if (credential.credentialSubject.expirationDate) {
    const expiryDate = new Date(credential.credentialSubject.expirationDate);
    if (expiryDate < new Date()) {
      return false;
    }
  }
  
  // More validation logic can be added here
  
  return true;
}

module.exports = {
  generateId,
  createModeratorCredentialData,
  createConsentRecord,
  createBanRecord,
  createAdminCredentialData,
  isCredentialValid,
}; 