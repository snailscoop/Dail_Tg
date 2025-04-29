/**
 * Test script for CHEQD Studio API key validation
 */

// Load environment variables
require('./local-env');

const axios = require('axios');

// Setup API client with API key
const apiClient = axios.create({
  baseURL: 'https://studio-api.cheqd.net',  // Base URL without /v1
  headers: {
    'x-api-key': process.env.CHEQD_STUDIO_API_KEY,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  validateStatus: status => status < 500 // Treat 400-level as success for debugging
});

// Display API key information
console.log('CHEQD Studio API Key Test');
console.log('------------------------');
console.log(`API Key (masked): ${process.env.CHEQD_STUDIO_API_KEY ? '******' + process.env.CHEQD_STUDIO_API_KEY.substr(-6) : 'Not set'}`);
console.log(`API Key length: ${process.env.CHEQD_STUDIO_API_KEY ? process.env.CHEQD_STUDIO_API_KEY.length : 0}`);
console.log();

// Try various endpoints to test authentication
async function testApiEndpoints() {
  console.log('Testing various API endpoints to identify working ones:');
  console.log('-----------------------------------------------------');
  
  // List of potential endpoints to test based on Swagger UI
  const endpoints = [
    // API info
    { method: 'get', url: '/' },
    { method: 'get', url: '/swagger' },
    
    // Try specific API endpoints shown in Swagger
    { method: 'get', url: '/api/v1/status' }, // Check if there's a status endpoint
    { method: 'get', url: '/v1/status' },     // Alternative path for status endpoint
    
    // Try the /account endpoint that showed up in Swagger
    { method: 'get', url: '/v1/account' },
    { method: 'get', url: '/account' },
    
    // Try a client endpoint
    { method: 'get', url: '/v1/client' },
    { method: 'get', url: '/client' },
    
    // Try the did resolve endpoint with a known test DID
    { method: 'get', url: '/v1/dids/did:cheqd:testnet:b5d47c7c-e3e7-4694-b1f4-f59277789253/resolve' },
    
    // Try the DID list endpoint 
    { method: 'get', url: '/v1/dids/list' },
    { method: 'get', url: '/dids/list' },
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\nTesting ${endpoint.method.toUpperCase()} ${endpoint.url}`);
      
      let response;
      if (endpoint.method === 'get') {
        response = await apiClient.get(endpoint.url, { params: endpoint.params });
      } else if (endpoint.method === 'post') {
        response = await apiClient.post(endpoint.url, endpoint.data || {});
      } else if (endpoint.method === 'options') {
        response = await apiClient.options(endpoint.url);
      }
      
      console.log('  Status:', response.status, response.statusText);
      if (response.headers && Object.keys(response.headers).length > 0) {
        console.log('  Important Headers:', {
          'content-type': response.headers['content-type'],
          'x-powered-by': response.headers['x-powered-by'],
        });
      }
      if (response.data) {
        console.log('  Data:', typeof response.data === 'object' ? JSON.stringify(response.data, null, 2).substring(0, 500) : response.data.substring(0, 500));
        if (typeof response.data === 'object' && Object.keys(response.data).length > 0) {
          console.log('  Found working endpoint!');
        }
      }
    } catch (error) {
      console.error(`  Error with ${endpoint.method.toUpperCase()} ${endpoint.url}:`, error.message);
      if (error.response) {
        console.error('  Status:', error.response.status, error.response.statusText);
        console.error('  Data:', error.response.data);
      }
    }
  }
  
  console.log('\nEndpoint testing completed.');
}

// Run the tests
testApiEndpoints(); 