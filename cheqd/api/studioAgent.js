/**
 * CHEQD Studio API client
 * This module provides integration with CHEQD Studio REST API
 */
const axios = require('axios');
const config = require('../config');

// Axios instance with base configuration
const apiClient = axios.create({
  baseURL: config.cheqdStudio.baseUrl,
  headers: {
    'x-api-key': config.cheqdStudio.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add request interceptor for logging
apiClient.interceptors.request.use(request => {
  console.log('CHEQD Studio API Request:', {
    method: request.method,
    url: request.url,
    headers: {
      'x-api-key': '******', // Don't log actual API key
      'Content-Type': request.headers['Content-Type'],
      'Accept': request.headers['Accept']
    },
    data: request.data
  });
  return request;
});

// Add response interceptor for logging
apiClient.interceptors.response.use(
  response => {
    console.log('CHEQD Studio API Response:', {
      status: response.status,
      statusText: response.statusText,
      data: response.data
    });
    return response;
  },
  error => {
    console.error('CHEQD Studio API Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

/**
 * Create a DID on cheqd using CHEQD Studio API
 * @param {string} alias - Alias for the DID
 * @returns {Promise<Object>} Created DID
 */
async function createCheqdDID(alias) {
  try {
    // According to the Swagger docs, the endpoint doesn't take alias directly
    // but we can use it as a metadata field if needed
    const response = await apiClient.post('/dids', {
      network: config.cheqd.network,
      identifierFormatType: 'uuid',
      verificationMethodType: 'Ed25519VerificationKey2018',
      // We can add service endpoints if needed
      service: [{
        idFragment: 'service-1',
        type: 'LinkedDomains',
        serviceEndpoint: ['https://example.com']
      }]
    });
    
    console.log(`Created DID via Studio API: ${response.data.did}`);
    return response.data;
  } catch (error) {
    console.error('Error creating cheqd DID via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Resolve a DID using CHEQD Studio API
 * @param {string} did - DID to resolve
 * @returns {Promise<Object>} Resolved DID Document
 */
async function resolveDID(did) {
  try {
    const response = await apiClient.get(`/dids/${encodeURIComponent(did)}/resolve`);
    return response.data;
  } catch (error) {
    console.error('Error resolving DID via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Issue a credential using CHEQD Studio API
 * @param {string} issuerDid - Issuer DID
 * @param {string} subjectDid - Subject DID
 * @param {Object} credentialData - Credential data
 * @returns {Promise<Object>} Issued credential
 */
async function issueCredential(issuerDid, subjectDid, credentialData) {
  try {
    const response = await apiClient.post('/credentials/issue', {
      issuerDid,
      subjectDid,
      attributes: credentialData,
      type: ['VerifiableCredential', 'ModeratorCredential'],
      format: 'jwt'
    });
    
    return response.data;
  } catch (error) {
    console.error('Error issuing credential via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Verify a credential using CHEQD Studio API
 * @param {Object} credential - Credential to verify
 * @returns {Promise<Object>} Verification result
 */
async function verifyCredential(credential) {
  try {
    const response = await apiClient.post('/credentials/verify', {
      credential
    });
    
    return response.data;
  } catch (error) {
    console.error('Error verifying credential via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a trust registry using CHEQD Studio API
 * @param {string} name - Trust registry name
 * @param {string} controllerDid - Controller DID
 * @returns {Promise<Object>} Created trust registry
 */
async function createTrustRegistry(name, controllerDid) {
  try {
    // This endpoint might need to be updated based on actual API documentation
    const response = await apiClient.post('/trust-registry', {
      name,
      controller: controllerDid,
      description: `Trust registry for ${name}`,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating trust registry via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Add member to trust registry using CHEQD Studio API
 * @param {string} registryId - Trust registry ID
 * @param {string} memberDid - Member DID to add
 * @param {string} role - Role for the member
 * @returns {Promise<Object>} Updated trust registry
 */
async function addTrustRegistryMember(registryId, memberDid, role) {
  try {
    // This endpoint might need to be updated based on actual API documentation
    const response = await apiClient.post(`/trust-registry/${registryId}/members`, {
      did: memberDid,
      role,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error adding trust registry member via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Create a status list using CHEQD Studio API
 * @param {string} issuerDid - Issuer DID
 * @param {string} statusPurpose - Purpose of the status list (e.g., 'revocation')
 * @returns {Promise<Object>} Created status list
 */
async function createStatusList(issuerDid, statusPurpose) {
  try {
    // This endpoint needs to be confirmed from actual API documentation
    const response = await apiClient.post('/status-list', {
      issuer: issuerDid,
      statusPurpose,
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating status list via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Update credential status using CHEQD Studio API
 * @param {string} statusListId - Status list ID
 * @param {string} credentialId - Credential ID to update
 * @param {boolean} revoked - Whether to revoke the credential
 * @returns {Promise<Object>} Updated status list
 */
async function updateCredentialStatus(statusListId, credentialId, revoked) {
  try {
    // Use revoke endpoint from the API
    const response = await apiClient.post(`/credentials/revoke?publish=true`, {
      credential: credentialId
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating credential status via Studio API:', error.response?.data || error.message);
    throw error;
  }
}

module.exports = {
  createCheqdDID,
  resolveDID,
  issueCredential,
  verifyCredential,
  createTrustRegistry,
  addTrustRegistryMember,
  createStatusList,
  updateCredentialStatus,
}; 