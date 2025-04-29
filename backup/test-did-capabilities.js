/**
 * Test script to check DID creation capabilities
 */

// Load environment variables
require('./local-env');

const studioApi = require('./cheqd/api/studio');

async function checkCapabilities() {
  console.log('Checking CHEQD Studio API capabilities');
  console.log('-------------------------------------');
  
  try {
    // Get account info
    const accountInfo = await studioApi.getAccountInfo();
    console.log('Account Information:');
    console.log(`Name: ${accountInfo.customer.name}`);
    console.log(`ID: ${accountInfo.customer.customerId}`);
    
    if (accountInfo.paymentAccount) {
      console.log('\nPayment Addresses:');
      console.log(`Mainnet: ${accountInfo.paymentAccount.mainnet || 'Not configured'}`);
      console.log(`Testnet: ${accountInfo.paymentAccount.testnet || 'Not configured'}`);
    }
    
    // Check DID creation capabilities
    console.log('\nChecking DID creation capabilities...');
    const canCreateDids = await studioApi.canCreateDids();
    
    if (canCreateDids) {
      console.log('✅ This account CAN create DIDs');
      
      // If we can create DIDs, try creating one
      console.log('\nAttempting to create a test DID...');
      
      const didResult = await studioApi.createDid({
        network: 'testnet',
        method: 'cheqd',
        options: {
          keyType: 'ed25519',
          metadata: {
            name: 'Test DID',
            description: 'Created for testing'
          }
        }
      });
      
      console.log('DID created successfully!');
      console.log(JSON.stringify(didResult, null, 2));
    } else {
      console.log('❌ This account CANNOT create DIDs');
      console.log('You need to upgrade your subscription to enable DID creation.');
    }
  } catch (error) {
    console.error('Error checking capabilities:', error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the capabilities check
checkCapabilities(); 