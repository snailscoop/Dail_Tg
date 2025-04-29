/**
 * Test authorization issues for testnet operations
 */

// Load environment variables
require('./local-env');

const axios = require('axios');
const config = require('./cheqd/config');

// Create a verbose client that shows more headers
const verboseClient = axios.create({
  baseURL: config.cheqdStudio.baseUrl,
  headers: {
    'x-api-key': config.cheqdStudio.apiKey,
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Log request and response details
verboseClient.interceptors.request.use(request => {
  console.log('Request Headers:', JSON.stringify(request.headers, null, 2));
  console.log('Request Data:', JSON.stringify(request.data, null, 2));
  return request;
});

verboseClient.interceptors.response.use(
  response => {
    console.log('Response Status:', response.status);
    console.log('Response Headers:', JSON.stringify(response.headers, null, 2));
    return response;
  },
  error => {
    console.log('Error Status:', error.response?.status);
    console.log('Error Headers:', JSON.stringify(error.response?.headers, null, 2));
    return Promise.reject(error);
  }
);

async function testTestnetAuth() {
  console.log('Testing Testnet Auth with CHEQD Studio Basic Plan');
  console.log('-----------------------------------------------');
  
  // First, try to get account info to show successful auth
  console.log('\n--- Account Info Test ---');
  try {
    const accountResponse = await verboseClient.get('/account');
    console.log('Account Data:', JSON.stringify(accountResponse.data, null, 2));
    console.log('✅ Account access successful');
  } catch (error) {
    console.error('❌ Account access failed:', error.message);
  }
  
  // Then attempt testnet DID creation
  console.log('\n--- Testnet DID Creation Test ---');
  try {
    const didResponse = await verboseClient.post('/did/create', {
      network: 'testnet',
      method: 'cheqd'
    });
    
    console.log('DID Response:', JSON.stringify(didResponse.data, null, 2));
    console.log('✅ DID creation successful');
  } catch (error) {
    console.error('❌ DID creation failed:', error.message);
    
    if (error.response?.data) {
      console.log('Error Data:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Print additional plan-related information
    console.log('\n--- Plan Information ---');
    
    const planIssues = [
      'You have a Basic plan which should allow testnet operations',
      'Possible reasons for authorization failures:',
      '1. The plan requires activation (beyond just subscribing)',
      '2. There might be a payment verification step needed',
      '3. The API functionality might require explicit enabling in account settings',
      '4. There could be a trial limitation (activation after trial period)'
    ];
    
    planIssues.forEach(issue => console.log(issue));
  }
}

// Run the test
testTestnetAuth(); 