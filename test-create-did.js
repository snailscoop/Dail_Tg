/**
 * Test script for DID creation using CHEQD Studio API
 */

// Load environment variables
require('./local-env');

const studioApi = require('./cheqd/api/studio');
const axios = studioApi.apiClient;

// Test various DID creation endpoint combinations
async function testDidCreation() {
  console.log('Testing DID Creation with CHEQD Studio API');
  console.log('------------------------------------------');
  
  // Verify account access first
  try {
    const accountInfo = await studioApi.getAccountInfo();
    console.log('Account verified:', accountInfo.customer.name);
    console.log();
  } catch (error) {
    console.error('Error accessing account, aborting tests:', error.message);
    return;
  }
  
  // Define potential endpoints for DID creation
  const endpoints = [
    '/dids/create',
    '/v1/dids/create',
    '/did/create',
    '/v1/did/create',
    '/api/dids/create',
    '/api/v1/dids/create'
  ];
  
  // Define potential payload formats
  const payloads = [
    // Format 1: Simple network specification
    {
      network: 'testnet'
    },
    
    // Format 2: Network and method specified
    {
      network: 'testnet',
      method: 'cheqd'
    },
    
    // Format 3: More detailed format
    {
      network: 'testnet',
      verificationMethod: {
        type: 'Ed25519VerificationKey2020'
      }
    },
    
    // Format 4: With additional metadata
    {
      network: 'testnet',
      method: 'cheqd',
      options: {
        keyType: 'ed25519',
        metadata: {
          name: 'Test DID',
          description: 'Created for testing'
        }
      }
    }
  ];
  
  // Try different combinations
  for (const endpoint of endpoints) {
    for (let i = 0; i < payloads.length; i++) {
      const payload = payloads[i];
      
      console.log(`Testing POST ${endpoint} with payload format ${i + 1}:`);
      console.log(JSON.stringify(payload, null, 2));
      
      try {
        const response = await axios.post(endpoint, payload);
        
        console.log('  Status:', response.status, response.statusText);
        console.log('  Response:', JSON.stringify(response.data, null, 2));
        console.log('  ✅ SUCCESS! Found working DID creation endpoint and format!');
        console.log('\n--------------------------------------------------\n');
        
        // If successful, we can stop testing
        return { endpoint, payload, response: response.data };
      } catch (error) {
        if (error.response && error.response.status !== 400) {
          // Show details for non-400 errors
          console.log(`  Status: ${error.response?.status || 'Unknown'}`);
          console.log(`  Error: ${error.message}`);
          
          if (error.response?.data) {
            console.log(`  Data: ${JSON.stringify(error.response.data, null, 2)}`);
          }
        } else {
          // Just a simple indicator for 400 errors
          console.log('  ❌ Failed with 400 Bad Request\n');
        }
      }
    }
  }
  
  console.log('\nAll DID creation attempts failed.');
}

// Run the test
testDidCreation(); 