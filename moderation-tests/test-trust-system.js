/**
 * Simplified test for the trust system in the CHEQD Telegram Bot
 * 
 * This script tests only the trust system functionality:
 * - Creating trusted members
 * - Checking if a user is trusted
 * - Listing trusted members 
 * - Removing trusted members
 */

const gundb = require('../storage/gundb');
const { initializeInstances } = require('../telegram/services/instanceService');

async function testTrustSystem() {
  console.log('=== Trust System Tests ===\n');
  
  // Initialize GunDB
  console.log('Initializing GunDB...');
  const gun = gundb.initBotNode();
  
  // Register with instanceService
  initializeInstances({ gun });
  
  const chatId = '-1002668658699';
  const ownerId = '2041129914';
  const ownerUsername = 'imasalmon';
  const userId1 = '1234567890';
  const username1 = 'testuser1';
  const userId2 = '9876543210';
  const username2 = 'testuser2';
  
  try {
    // Test 1: Create trusted member
    console.log('\n[TEST 1] Creating trusted member...');
    await gundb.storeTrustedMember(gun, userId1, username1, chatId, ownerId);
    console.log('✅ Trusted member created successfully');
    
    // Test 2: Check if user is trusted
    console.log('\n[TEST 2] Checking if user is trusted...');
    const isTrusted = await gundb.isUserTrusted(gun, userId1, chatId);
    console.log(`Is user trusted: ${isTrusted}`);
    console.log(isTrusted ? '✅ isUserTrusted working correctly' : '❌ isUserTrusted failed');
    
    // Test 3: Create another trusted member
    console.log('\n[TEST 3] Creating another trusted member...');
    await gundb.storeTrustedMember(gun, userId2, username2, chatId, ownerId);
    console.log('✅ Second trusted member created successfully');
    
    // Test 4: Get trusted members for chat
    console.log('\n[TEST 4] Getting trusted members for chat...');
    const trustedMembers = await gundb.getTrustedMembersForChat(gun, chatId);
    console.log(`Found ${trustedMembers.length} trusted members`);
    
    // Display the trusted members if any were found
    if (trustedMembers.length > 0) {
      console.log('Trusted members:');
      trustedMembers.forEach(member => {
        console.log(`- ${member.username} (${member.userId})`);
      });
      console.log('✅ getTrustedMembersForChat working correctly');
    } else {
      console.log('❌ No trusted members found');
    }
    
    // Test 5: Remove a trusted member
    console.log('\n[TEST 5] Removing a trusted member...');
    const removeResult = await gundb.removeTrustedMember(gun, userId1, chatId);
    console.log(`Remove result: ${removeResult}`);
    
    // Test 6: Verify the user is no longer trusted
    console.log('\n[TEST 6] Verifying user is no longer trusted...');
    const isStillTrusted = await gundb.isUserTrusted(gun, userId1, chatId);
    console.log(`Is user still trusted: ${isStillTrusted}`);
    console.log(isStillTrusted ? '❌ removeTrustedMember failed' : '✅ removeTrustedMember working correctly');
    
    // Final check on remaining trusted members
    console.log('\n[TEST 7] Final check on remaining trusted members...');
    const remainingTrusted = await gundb.getTrustedMembersForChat(gun, chatId);
    console.log(`Found ${remainingTrusted.length} trusted members`);
    
    // Display the remaining trusted members
    if (remainingTrusted.length > 0) {
      console.log('Remaining trusted members:');
      remainingTrusted.forEach(member => {
        console.log(`- ${member.username} (${member.userId})`);
      });
    }
    
    console.log('\n=== Trust System Tests Completed ===');
    
  } catch (error) {
    console.error('Error during trust system tests:', error);
  } finally {
    // Allow GunDB to finish any pending operations
    setTimeout(() => {
      console.log('\nTests completed. Exiting...');
      process.exit(0);
    }, 2000);
  }
}

// Run the test
testTrustSystem(); 