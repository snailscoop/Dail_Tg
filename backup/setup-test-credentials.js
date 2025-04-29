const gundb = require('./storage/gundb');
const { initializeInstances } = require('./telegram/services/instanceService');

async function setupTestCredentials() {
  console.log('Setting up test credentials...');
  
  // Initialize GunDB
  const gun = gundb.initBotNode();
  
  // Register instances
  initializeInstances({ gun, bot: {} });
  
  const chatId = '-1002668658699';
  const moderatorId = '5498994297';
  const moderatorDid = 'did:cheqd:testnet:r8qpdswjmb87y46ep04to';
  const issuerDid = 'did:cheqd:testnet:hmf3inaa70csdbta7h3xj';
  
  // Store moderator credential
  const credentialId = 'urn:uuid:test-moderator-credential';
  const metadata = {
    type: 'ModeratorCredential',
    chatId: chatId,
    canBan: true,
    canMute: true,
    canDelete: true,
    canIssueWarnings: true
  };
  
  console.log(`Creating moderator credential for user ${moderatorId} in chat ${chatId}`);
  
  try {
    await gundb.storeCredential(
      gun,
      credentialId,
      issuerDid,
      moderatorDid,
      metadata
    );
    
    console.log('Credential stored successfully!');
    
    // Also store a user DID mapping
    gun.get('user_did_mapping')
      .get(moderatorId)
      .put({
        userId: moderatorId,
        did: moderatorDid,
        timestamp: Date.now()
      }, ack => {
        if (ack.err) {
          console.error('Error storing user DID mapping:', ack.err);
        } else {
          console.log(`DID mapping stored for user ${moderatorId}: ${moderatorDid}`);
        }
      });
    
    // Store a trusted member record
    await gundb.storeTrustedMember(
      gun,
      moderatorId,
      'GarthVader1',
      chatId,
      '2041129914' // Added by the owner
    );
    
    console.log('Trusted member record created successfully!');
    
    // Wait for GunDB to sync
    setTimeout(() => {
      console.log('Setup completed. You can now run the test script.');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('Error setting up credentials:', error);
    process.exit(1);
  }
}

setupTestCredentials(); 