/**
 * Cleanup script for test data
 * 
 * This script removes test data created during moderation tests.
 * Run this after testing to clean up the GunDB database.
 */

const gundb = require('../storage/gundb');
const { initializeInstances } = require('../telegram/services/instanceService');

async function cleanupTestData() {
  console.log('=== Cleaning Up Test Data ===\n');
  
  // Initialize GunDB
  console.log('Initializing GunDB...');
  const gun = gundb.initBotNode();
  
  // Register with instanceService
  initializeInstances({ gun });
  
  // Test data identifiers
  const chatId = '-1002668658699';
  const testUserIds = [
    '1234567890',  // regular user
    '9876543210',  // second test user
    // Add other test user IDs here as needed
  ];
  
  try {
    // 1. Clean up trusted members records
    console.log('\nRemoving trusted member records...');
    for (const userId of testUserIds) {
      const recordId = `trusted_${chatId}_${userId}`;
      console.log(`Removing trusted member record: ${recordId}`);
      
      gun.get('trusted_members')
        .get(recordId)
        .put(null, (ack) => {
          if (ack.err) {
            console.error(`Error removing trusted record ${recordId}:`, ack.err);
          } else {
            console.log(`✅ Removed trusted member record: ${recordId}`);
          }
        });
    }
    
    // 2. Clean up credentials (more complex, need to find by subject)
    console.log('\nRemoving test credentials...');
    const testCredentialIds = [
      'urn:uuid:test-moderator-credential',
      // Add other test credential IDs here
    ];
    
    for (const credId of testCredentialIds) {
      console.log(`Removing credential: ${credId}`);
      
      gun.get('credentials')
        .get(credId)
        .put(null, (ack) => {
          if (ack.err) {
            console.error(`Error removing credential ${credId}:`, ack.err);
          } else {
            console.log(`✅ Removed credential: ${credId}`);
          }
        });
    }
    
    // 3. Clean up user DID mappings
    console.log('\nRemoving test user DID mappings...');
    for (const userId of testUserIds) {
      console.log(`Removing DID mapping for user: ${userId}`);
      
      gun.get('user_did_mapping')
        .get(userId)
        .put(null, (ack) => {
          if (ack.err) {
            console.error(`Error removing DID mapping for ${userId}:`, ack.err);
          } else {
            console.log(`✅ Removed DID mapping for user: ${userId}`);
          }
        });
    }
    
    console.log('\n=== Cleanup Completed ===');
    
  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    // Allow time for GunDB operations to complete
    setTimeout(() => {
      console.log('\nCleanup operations completed. Exiting...');
      process.exit(0);
    }, 3000); // Wait a bit longer for cleanup operations
  }
}

// Run the cleanup
cleanupTestData(); 