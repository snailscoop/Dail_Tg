/**
 * Test script for creating a DID with Veramo
 * Now that we've disabled CHEQD Studio, this should use the direct Veramo implementation
 */

// Load environment variables
require('./local-env');

// Import the unified API wrapper
const cheqdApi = require('./cheqd/api');

async function testVeramoDid() {
  console.log('Testing DID creation with Veramo agent');
  console.log('-------------------------------------');
  
  // Verify we're using Veramo and not Studio
  console.log(`Using CHEQD Studio: ${cheqdApi.usingStudio ? 'Yes' : 'No'}`);
  console.log('If "No", we are using Veramo for direct blockchain interaction.');
  
  if (cheqdApi.usingStudio) {
    console.log('❌ Still using CHEQD Studio! Check configuration.');
    return;
  }
  
  // Attempt to create a DID
  try {
    console.log('\nAttempting to create a DID...');
    const did = await cheqdApi.createCheqdDID('test-veramo-' + Date.now());
    
    console.log('✅ Successfully created DID with Veramo:');
    console.log(`DID: ${did.did}`);
    console.log(`Provider: ${did.provider}`);
    console.log(`Alias: ${did.alias}`);
    
    // Test credential issuance
    console.log('\nAttempting to issue a test credential...');
    const testCredential = await cheqdApi.issueCredential(
      did.did,
      did.did, // Self-issued for testing
      {
        name: 'Test User',
        role: 'Tester',
        permissions: ['read', 'write']
      }
    );
    
    console.log('✅ Successfully issued credential:');
    console.log(JSON.stringify(testCredential, null, 2).substring(0, 500) + '...');
    
    // Test credential verification
    console.log('\nAttempting to verify the credential...');
    const verificationResult = await cheqdApi.verifyCredential(testCredential);
    
    console.log('✅ Verification result:');
    console.log(`Verified: ${verificationResult.verified}`);
    if (verificationResult.error) {
      console.log(`Error: ${verificationResult.error}`);
    }
    
    return {
      did,
      credential: testCredential,
      verificationResult
    };
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
  }
}

// Run the test
testVeramoDid(); 