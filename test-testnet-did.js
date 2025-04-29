/**
 * Test script for testnet DID creation using CHEQD Studio API
 * 
 * The Basic plan should allow testnet operations
 */

// Load environment variables
require('./local-env');

const studioApi = require('./cheqd/api/studio');
const axios = studioApi.apiClient;

// Test testnet DID creation
async function testTestnetDidCreation() {
  console.log('Testing Testnet DID Creation with CHEQD Studio Basic Plan');
  console.log('----------------------------------------------------');
  
  // Verify account access first
  try {
    const accountInfo = await studioApi.getAccountInfo();
    console.log('Account verified:', accountInfo.customer.name);
    console.log('Plan should allow testnet operations\n');
  } catch (error) {
    console.error('Error accessing account, aborting tests:', error.message);
    return;
  }
  
  // Prepare testnet-specific payload
  const testnetPayload = {
    network: 'testnet',
    method: 'cheqd'
  };
  
  // Try both endpoint variations
  const endpoints = [
    '/did/create',
    // Add a fallback if the primary one doesn't work
    '/dids/create'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`Testing POST ${endpoint} with testnet payload:`);
    console.log(JSON.stringify(testnetPayload, null, 2));
    
    try {
      const response = await axios.post(endpoint, testnetPayload);
      
      console.log('  Status:', response.status, response.statusText);
      console.log('  Response:', JSON.stringify(response.data, null, 2));
      console.log('  ✅ SUCCESS! Created testnet DID');
      
      return { endpoint, response: response.data };
    } catch (error) {
      if (error.response) {
        console.log(`  Status: ${error.response.status}`);
        
        if (error.response.data) {
          console.log(`  Error data: ${JSON.stringify(error.response.data, null, 2)}`);
        }
        
        if (error.response.status === 403) {
          console.log('  ❓ Received 403 Unauthorized. This may indicate a payment/plan issue.');
        } else if (error.response.status === 400) {
          console.log('  ❓ Received 400 Bad Request. This may indicate incorrect payload format.');
        }
      } else {
        console.log(`  Error: ${error.message}`);
      }
    }
  }
  
  console.log('\n❌ Unable to create testnet DID with current plan credentials.');
  console.log('This might be a restriction even on the Basic plan, or there might be additional requirements.');
  console.log('Consider checking with CHEQD support if testnet operations should be available.');
}

// Run the test
testTestnetDidCreation(); 