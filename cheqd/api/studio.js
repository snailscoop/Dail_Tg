/**
 * CHEQD Studio API Client
 * 
 * Helper functions for working with the CHEQD Studio API
 */

const axios = require('axios');
const config = require('../config');

// Initialize API client with configuration
const apiClient = axios.create({
  baseURL: config.cheqdStudio.baseUrl,
  headers: {
    'x-api-key': config.cheqdStudio.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Get account information from CHEQD Studio
 * 
 * @returns {Promise<Object>} Account information including customer details and payment addresses
 */
async function getAccountInfo() {
  try {
    const response = await apiClient.get('/account');
    return response.data;
  } catch (error) {
    console.error('Error fetching account info:', error.message);
    throw error;
  }
}

/**
 * Create a new DID using CHEQD Studio
 * 
 * Note: This requires subscription permissions beyond basic account access.
 * Without proper subscription, the API will return a 403 Unauthorized error.
 * 
 * @param {Object} options DID creation options
 * @param {string} options.network Network to create DID on ('testnet' or 'mainnet')
 * @param {string} [options.method='cheqd'] DID method to use
 * @param {Object} [options.options] Additional options for DID creation
 * @returns {Promise<Object>} The created DID information
 */
async function createDid(options = { network: 'testnet' }) {
  try {
    const response = await apiClient.post('/did/create', options);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error('Unauthorized: Your account does not have permission to create DIDs. You may need to upgrade your subscription.');
    } else {
      console.error('Error creating DID:', error.message);
    }
    throw error;
  }
}

/**
 * Check if the account has DID creation capabilities
 * 
 * @returns {Promise<boolean>} Whether the account can create DIDs
 */
async function canCreateDids() {
  try {
    await apiClient.post('/did/create', { network: 'testnet' });
    return true;
  } catch (error) {
    if (error.response && error.response.status === 403) {
      return false;
    }
    throw error;
  }
}

// Export API functions
module.exports = {
  getAccountInfo,
  createDid,
  canCreateDids,
  apiClient // Export the client for advanced usage
}; 