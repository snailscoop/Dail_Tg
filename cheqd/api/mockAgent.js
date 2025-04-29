/**
 * Mock Agent for CHEQD
 * 
 * This provides a simulated implementation for the hackathon that doesn't require
 * actual blockchain interactions or CHEQD Studio API access.
 */

// Internal storage for DIDs and credentials
const mockStorage = {
  dids: new Map(),
  credentials: new Map(),
  verifications: new Map(),
  revocations: new Map()
};

// Helper to generate unique IDs
function generateId() {
  return 'did:cheqd:testnet:' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Create a DID on cheqd (mocked)
 * @param {string} alias - Alias for the DID
 * @returns {Promise<Object>} Created DID
 */
async function createCheqdDID(alias) {
  try {
    // Create a mock DID with a realistic structure
    const mockDid = {
      did: generateId(),
      provider: 'did:cheqd',
      alias: alias || 'unnamed',
      keys: [
        {
          type: 'Ed25519',
          kid: 'default',
          publicKeyHex: Buffer.from(Math.random().toString()).toString('hex'),
          privateKeyHex: Buffer.from(Math.random().toString()).toString('hex')
        }
      ],
      services: []
    };
    
    // Store the mock DID
    mockStorage.dids.set(mockDid.did, mockDid);
    console.log(`[MOCK] Created DID: ${mockDid.did}`);
    return mockDid;
  } catch (error) {
    console.error('[MOCK] Error creating cheqd DID:', error);
    throw error;
  }
}

/**
 * Issue a credential (mocked)
 * @param {string} issuerDid - Issuer DID
 * @param {string} subjectDid - Subject DID
 * @param {Object} credentialData - Credential data
 * @returns {Promise<Object>} Issued credential
 */
async function issueCredential(issuerDid, subjectDid, credentialData) {
  try {
    // Check if the issuer DID exists in our mock storage
    if (!mockStorage.dids.has(issuerDid)) {
      console.warn(`[MOCK] Issuer DID ${issuerDid} not found, creating it automatically`);
      await createCheqdDID(`issuer-${Date.now()}`);
    }
    
    // Generate a credential ID
    const credentialId = `urn:uuid:${Math.random().toString(36).substring(2, 15)}`;
    
    // Create a mock credential with a realistic structure
    const mockCredential = {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://www.w3.org/2018/credentials/examples/v1'
      ],
      id: credentialId,
      type: ['VerifiableCredential', credentialData.type || 'ModeratorCredential'],
      issuer: { id: issuerDid },
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: subjectDid,
        ...credentialData
      },
      proof: {
        type: 'Ed25519Signature2018',
        created: new Date().toISOString(),
        proofPurpose: 'assertionMethod',
        verificationMethod: `${issuerDid}#keys-1`,
        jws: 'eyJhbGci...' // Fake signature
      }
    };
    
    // Store the mock credential
    mockStorage.credentials.set(credentialId, mockCredential);
    console.log(`[MOCK] Issued credential: ${credentialId}`);
    return mockCredential;
  } catch (error) {
    console.error('[MOCK] Error issuing credential:', error);
    throw error;
  }
}

/**
 * Verify a credential (mocked)
 * @param {Object} credential - Credential to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyCredential(credential) {
  try {
    // Check if credential is revoked
    const credentialId = credential.id;
    if (mockStorage.revocations.has(credentialId)) {
      return {
        verified: false,
        results: [
          {
            proof: credential.proof,
            verified: false,
            error: 'Credential has been revoked',
            revocationInfo: mockStorage.revocations.get(credentialId)
          }
        ]
      };
    }
    
    // Always return successful verification for the mock
    const verificationResult = {
      verified: true,
      results: [
        {
          proof: credential.proof,
          verified: true,
          verifier: 'mock-verifier'
        }
      ]
    };
    
    // Store the verification result
    mockStorage.verifications.set(credential.id, verificationResult);
    console.log(`[MOCK] Verified credential: ${credential.id}`);
    return verificationResult;
  } catch (error) {
    console.error('[MOCK] Error verifying credential:', error);
    return {
      verified: false,
      error: error.message
    };
  }
}

/**
 * Revoke a credential (mocked)
 * @param {string} credentialId - ID of the credential to revoke
 * @param {string} issuerDid - DID of the issuer who is revoking the credential
 * @returns {Promise<Object>} Revocation result
 */
async function revokeCredential(credentialId, issuerDid) {
  try {
    // Check if credential exists
    if (!mockStorage.credentials.has(credentialId)) {
      throw new Error('Credential not found');
    }
    
    const credential = mockStorage.credentials.get(credentialId);
    
    // Check if the issuer is the one who issued the credential
    if (credential.issuer.id !== issuerDid) {
      throw new Error('Only the original issuer can revoke a credential');
    }
    
    // Record the revocation
    const revocationInfo = {
      credentialId,
      revokedBy: issuerDid,
      revocationDate: new Date().toISOString(),
      reason: 'Revoked by issuer'
    };
    
    mockStorage.revocations.set(credentialId, revocationInfo);
    console.log(`[MOCK] Revoked credential: ${credentialId}`);
    
    return {
      success: true,
      revocationInfo
    };
  } catch (error) {
    console.error('[MOCK] Error revoking credential:', error);
    throw error;
  }
}

/**
 * Get all DIDs (mock only function)
 * @returns {Array} List of DIDs
 */
function getAllDids() {
  return Array.from(mockStorage.dids.values());
}

/**
 * Get all credentials (mock only function)
 * @returns {Array} List of credentials
 */
function getAllCredentials() {
  return Array.from(mockStorage.credentials.values());
}

/**
 * Get credential by ID (mock only function)
 * @param {string} credentialId - ID of the credential
 * @returns {Object|undefined} Credential or undefined if not found
 */
function getCredentialById(credentialId) {
  return mockStorage.credentials.get(credentialId);
}

/**
 * Check if a credential is revoked (mock only function)
 * @param {string} credentialId - ID of the credential
 * @returns {boolean} Whether the credential is revoked
 */
function isCredentialRevoked(credentialId) {
  return mockStorage.revocations.has(credentialId);
}

module.exports = {
  createCheqdDID,
  issueCredential,
  verifyCredential,
  revokeCredential,
  getAllDids,
  getAllCredentials,
  getCredentialById,
  isCredentialRevoked
}; 