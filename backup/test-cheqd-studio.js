/**
 * Test script for CHEQD Studio API integration
 * 
 * This script tests the basic functionality of the CHEQD Studio integration.
 */

// Load environment variables
require('./local-env');

// Import the unified CHEQD API interface
const cheqdApi = require('./cheqd/api');
const config = require('./cheqd/config');

// Display current configuration
console.log('CHEQD Configuration:');
console.log('-------------------');
console.log(`Using CHEQD Studio: ${cheqdApi.usingStudio ? 'Yes' : 'No'}`);
console.log(`CHEQD Network: ${config.cheqd.network}`);
console.log(`CHEQD Studio Base URL: ${config.cheqdStudio.baseUrl}`);
console.log(`CHEQD Studio API Key: ${config.cheqdStudio.apiKey ? '******' + config.cheqdStudio.apiKey.substr(-6) : 'Not set'}`);
console.log();

// Test functions
async function runTests() {
  try {
    // Test 1: Create a DID
    console.log('Test 1: Creating a DID...');
    try {
      const did = await cheqdApi.createCheqdDID('test-user-' + Date.now().toString(36));
      console.log(`DID created: ${did.did}`);
      console.log('Test 1: Success!');
      console.log();

      // Test 2: Resolve the DID (Studio only feature)
      if (cheqdApi.usingStudio) {
        console.log('Test 2: Resolving the DID...');
        try {
          const resolvedDid = await cheqdApi.resolveDID(did.did);
          console.log(`DID resolved: ${resolvedDid.didDocument.id}`);
          console.log('Test 2: Success!');
        } catch (error) {
          console.log('Test 2: Failed - API may not have permission for DID resolution');
          console.log(`Error: ${error.message}`);
        }
        console.log();
      } else {
        console.log('Test 2: Skipped - DID resolution requires CHEQD Studio');
        console.log();
      }

      // Test 3: Issue a credential
      console.log('Test 3: Issuing a credential...');
      try {
        const credential = await cheqdApi.issueCredential(
          did.did, // issuer
          did.did, // subject (self-issued for testing)
          {
            type: 'TestCredential',
            testAttribute: 'test-value',
            issuanceDate: new Date().toISOString()
          }
        );
        console.log(`Credential issued: ${credential.proof && credential.proof.jwt ? 'Yes' : 'No'}`);
        console.log('Test 3: Success!');
        
        // Test 4: Verify the credential
        console.log('Test 4: Verifying the credential...');
        try {
          const verificationResult = await cheqdApi.verifyCredential(credential);
          console.log(`Credential verified: ${verificationResult.verified ? 'Yes' : 'No'}`);
          console.log('Test 4: Success!');
        } catch (error) {
          console.log('Test 4: Failed - API may not have permission for credential verification');
          console.log(`Error: ${error.message}`);
        }
      } catch (error) {
        console.log('Test 3: Failed - API may not have permission for credential issuance');
        console.log(`Error: ${error.message}`);
      }
      console.log();

      // Test 5: Create a trust registry (Studio only feature)
      if (cheqdApi.usingStudio) {
        console.log('Test 5: Creating a trust registry...');
        try {
          const registry = await cheqdApi.createTrustRegistry('Test Registry', did.did);
          console.log(`Trust registry created: ${registry.id}`);
          console.log('Test 5: Success!');
        } catch (error) {
          console.log('Test 5: Failed - API may not have permission for trust registry creation');
          console.log(`Error: ${error.message}`);
        }
        console.log();
      } else {
        console.log('Test 5: Skipped - Trust registry requires CHEQD Studio');
        console.log();
      }
    } catch (error) {
      console.log('Test 1: Failed - API may not have permission for DID creation');
      console.log(`Error: ${error.message}`);
      console.log();
      
      console.log('Skipping remaining tests since DID creation failed');
      console.log();
      
      console.log('Falling back to Veramo agent for a test...');
      
      if (cheqdApi.veramoAgent) {
        console.log('Testing Veramo agent DID creation...');
        try {
          const veramoDid = await cheqdApi.veramoAgent.createCheqdDID('test-user-veramo-' + Date.now().toString(36));
          console.log(`Veramo DID created: ${veramoDid.did}`);
          console.log('Veramo test successful!');
        } catch (error) {
          console.log('Veramo test failed:');
          console.log(`Error: ${error.message}`);
        }
      }
    }

    console.log();
    console.log('Tests completed. Check the results above to see which features are accessible with your current API key.');
    console.log('If certain features failed, your API key may need additional permissions.');
    console.log('Refer to the CHEQD-STUDIO-SETUP.md file for more information.');
  } catch (error) {
    console.error('Unexpected error during tests:', error.message);
    console.error(error.stack);
  }
}

// Run the tests
console.log('Starting CHEQD API tests...');
runTests().then(() => {
  console.log('All tests completed.');
}); 