/**
 * Unified CHEQD API Interface
 * 
 * This module provides a unified interface for working with either:
 * 1. Direct blockchain interaction via Veramo agent
 * 2. CHEQD Studio REST API
 * 3. Mock implementation for hackathon development
 * 
 * It automatically selects the appropriate implementation based on configuration
 */
const config = require('../config');
const veramoAgent = require('./agent');
const studioAgent = require('./studioAgent');
const mockAgent = require('./mockAgent');

// Determine which implementation to use based on configuration
const useStudio = config.cheqdStudio.enabled;

// For hackathon, use mock implementation to avoid blockchain integration issues
// This can be controlled by an environment variable
const useMock = process.env.USE_MOCK_CHEQD === 'true' || true; // Default to true for hackathon

/**
 * Get the appropriate agent based on configuration
 * @returns {Object} The agent implementation
 */
function getAgent() {
  if (config.useMock) {
    console.log('Using mock CHEQD implementation (suitable for hackathon)');
    return mockAgent;
  }
  
  if (config.cheqdStudio.enabled) {
    console.log(`Using CHEQD Studio API implementation for ${config.cheqd.network}`);
    return studioAgent;
  }
  
  console.log(`Using Veramo implementation for ${config.cheqd.network}`);
  return veramoAgent;
}

// Get the configured agent
const agent = getAgent();

/**
 * Create a DID on cheqd
 * @param {string} alias - Alias for the DID
 * @returns {Promise<Object>} Created DID
 */
async function createCheqdDID(alias) {
  return agent.createCheqdDID(alias);
}

/**
 * Issue a credential
 * @param {string} issuerDid - Issuer DID
 * @param {string} subjectDid - Subject DID
 * @param {Object} credentialData - Credential data
 * @returns {Promise<Object>} Issued credential
 */
async function issueCredential(issuerDid, subjectDid, credentialData) {
  return agent.issueCredential(issuerDid, subjectDid, credentialData);
}

/**
 * Verify a credential
 * @param {Object} credential - Credential to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyCredential(credential) {
  return agent.verifyCredential(credential);
}

/**
 * Revoke a credential
 * @param {string} credentialId - ID of the credential to revoke
 * @param {string} issuerDid - DID of the issuer who is revoking the credential
 * @returns {Promise<Object>} Revocation result
 */
async function revokeCredential(credentialId, issuerDid) {
  return agent.revokeCredential(credentialId, issuerDid);
}

/**
 * Get information about a DID
 * @param {string} did - DID to resolve
 * @returns {Promise<Object>} DID Document
 */
async function resolveDid(did) {
  if (agent.resolveDid) {
    return agent.resolveDid(did);
  }
  
  // Fallback for mock implementation
  const mockDids = await agent.getAllDids();
  const didDoc = mockDids.find(d => d.did === did);
  
  if (!didDoc) {
    throw new Error(`DID not found: ${did}`);
  }
  
  return {
    didDocument: {
      id: didDoc.did,
      controller: [didDoc.did],
      verificationMethod: [
        {
          id: `${didDoc.did}#keys-1`,
          type: 'Ed25519VerificationKey2020',
          controller: didDoc.did,
          publicKeyHex: didDoc.keys[0].publicKeyHex
        }
      ]
    }
  };
}

/**
 * Check if a credential is revoked
 * @param {string} credentialId - ID of the credential to check
 * @returns {Promise<boolean>} Whether the credential is revoked
 */
async function isCredentialRevoked(credentialId) {
  if (agent.isCredentialRevoked) {
    return agent.isCredentialRevoked(credentialId);
  }
  
  // Fallback for implementations without direct revocation check
  try {
    const credential = await getCredentialById(credentialId);
    if (!credential) {
      throw new Error('Credential not found');
    }
    
    const verificationResult = await verifyCredential(credential);
    return !verificationResult.verified;
  } catch (error) {
    console.error('Error checking credential revocation status:', error);
    // Assume revoked if there's an error (safer approach)
    return true;
  }
}

/**
 * Get a credential by ID
 * @param {string} credentialId - ID of the credential
 * @returns {Promise<Object|null>} Credential or null if not found
 */
async function getCredentialById(credentialId) {
  if (agent.getCredentialById) {
    return agent.getCredentialById(credentialId);
  }
  
  // Fallback for implementations without direct credential lookup
  // This would be implemented differently in production systems
  const allCredentials = await agent.getAllCredentials();
  return allCredentials.find(c => c.id === credentialId) || null;
}

/**
 * Create a trust registry (Studio only feature, mock for hackathon)
 * @param {string} name - Trust registry name
 * @param {string} controllerDid - Controller DID
 * @returns {Promise<Object>} Created trust registry
 */
async function createTrustRegistry(name, controllerDid) {
  if (useStudio) {
    return studioAgent.createTrustRegistry(name, controllerDid);
  }
  
  if (useMock) {
    console.log('[MOCK MODE] Using mock implementation for createTrustRegistry');
    return {
      id: `registry-${Date.now()}`,
      name,
      controller: controllerDid,
      members: [],
      created: new Date().toISOString()
    };
  }
  
  throw new Error('Trust Registry features are only available with CHEQD Studio or mock mode');
}

/**
 * Add member to trust registry (Studio only feature, mock for hackathon)
 * @param {string} registryId - Trust registry ID
 * @param {string} memberDid - Member DID to add
 * @param {string} role - Role for the member
 * @returns {Promise<Object>} Updated trust registry
 */
async function addTrustRegistryMember(registryId, memberDid, role) {
  if (useStudio) {
    return studioAgent.addTrustRegistryMember(registryId, memberDid, role);
  }
  
  if (useMock) {
    console.log('[MOCK MODE] Using mock implementation for addTrustRegistryMember');
    return {
      id: registryId,
      members: [{
        did: memberDid,
        role,
        added: new Date().toISOString()
      }]
    };
  }
  
  throw new Error('Trust Registry features are only available with CHEQD Studio or mock mode');
}

/**
 * Create a status list (Studio only feature, mock for hackathon)
 * @param {string} issuerDid - Issuer DID
 * @param {string} statusPurpose - Purpose of the status list
 * @returns {Promise<Object>} Created status list
 */
async function createStatusList(issuerDid, statusPurpose) {
  if (useStudio) {
    return studioAgent.createStatusList(issuerDid, statusPurpose);
  }
  
  if (useMock) {
    console.log('[MOCK MODE] Using mock implementation for createStatusList');
    return {
      id: `status-list-${Date.now()}`,
      issuer: issuerDid,
      purpose: statusPurpose,
      entries: [],
      created: new Date().toISOString()
    };
  }
  
  throw new Error('Status List features are only available with CHEQD Studio or mock mode');
}

/**
 * Update credential status (Studio only feature, mock for hackathon)
 * @param {string} statusListId - Status list ID
 * @param {string} credentialId - Credential ID to update
 * @param {boolean} revoked - Whether to revoke the credential
 * @returns {Promise<Object>} Updated status list
 */
async function updateCredentialStatus(statusListId, credentialId, revoked) {
  if (useStudio) {
    return studioAgent.updateCredentialStatus(statusListId, credentialId, revoked);
  }
  
  if (useMock) {
    console.log('[MOCK MODE] Using mock implementation for updateCredentialStatus');
    return {
      id: statusListId,
      entries: [{
        credentialId,
        revoked,
        updated: new Date().toISOString()
      }]
    };
  }
  
  throw new Error('Status List features are only available with CHEQD Studio or mock mode');
}

// Export the unified API
module.exports = {
  // Core features (available in all modes)
  createCheqdDID,
  issueCredential,
  verifyCredential,
  revokeCredential,
  
  // Extended features
  resolveDid,
  isCredentialRevoked,
  getCredentialById,
  createTrustRegistry,
  addTrustRegistryMember,
  createStatusList,
  updateCredentialStatus,
  
  // Access to specific implementations
  veramoAgent,
  studioAgent,
  mockAgent,
  
  // Configuration information
  usingStudio: useStudio,
  usingMock: useMock
}; 