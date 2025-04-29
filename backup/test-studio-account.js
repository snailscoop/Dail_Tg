/**
 * Test CHEQD Studio API account information
 */

// Load environment variables
require('./local-env');

// Import our helper module
const studioApi = require('./cheqd/api/studio');

async function testAccountInfo() {
  console.log('Testing CHEQD Studio API account info...');
  console.log('----------------------------------------');
  
  try {
    const accountInfo = await studioApi.getAccountInfo();
    
    console.log('Account Information:');
    console.log(JSON.stringify(accountInfo, null, 2));
    
    if (accountInfo.customer && accountInfo.customer.customerId) {
      console.log('\n✅ Successfully retrieved account information!');
      console.log(`Customer Name: ${accountInfo.customer.name}`);
      console.log(`Customer ID: ${accountInfo.customer.customerId}`);
      
      if (accountInfo.paymentAccount) {
        console.log('\nPayment Addresses:');
        console.log(`Mainnet: ${accountInfo.paymentAccount.mainnet || 'Not configured'}`);
        console.log(`Testnet: ${accountInfo.paymentAccount.testnet || 'Not configured'}`);
      }
    } else {
      console.log('\n❌ Account information doesn\'t have the expected structure');
    }
  } catch (error) {
    console.error('\n❌ Error fetching account information:');
    console.error(error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAccountInfo(); 