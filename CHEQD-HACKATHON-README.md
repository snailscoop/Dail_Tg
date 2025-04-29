# CHEQD Integration for Hackathon

## Current Implementation

For the hackathon, we've implemented a flexible CHEQD integration system that allows us to:

1. Disable the CHEQD Studio API (which requires a paid subscription for core functionality)
2. Use a mock implementation that simulates DID and credential operations
3. Keep the architecture ready for a real blockchain integration post-hackathon

## How It Works

The system uses a unified API wrapper (`cheqd/api/index.js`) that automatically selects the appropriate implementation:

- **Mock Implementation**: Used for the hackathon to quickly develop and test features
- **CHEQD Studio API**: Disabled, but can be enabled later with a paid subscription
- **Veramo Direct Integration**: Framework is in place, but needs proper configuration and debugging

## Testing the Implementation

Run the test script to see it in action:

```bash
node test-veramo-did.js
```

This script will:
- Create a DID 
- Issue a credential
- Verify the credential

## Architecture Benefits

This approach gives us several advantages:

1. **Working Implementation Now**: The mock provides a functional implementation for the hackathon
2. **Realistic Data Format**: The mocks return realistic data structures matching what real implementations would provide
3. **Seamless Future Transition**: When ready to use real blockchain, we only need to:
   - Fix the Veramo integration issues
   - Set `USE_MOCK_CHEQD=false` in environment variables

## Limitations & Post-Hackathon Work

For a production environment, the following would need to be addressed:

1. **Fix Veramo CHEQD Integration**: The direct blockchain integration needs debugging (current error: `Cannot read properties of undefined (reading 'map')`)
2. **Fund CHEQD Wallet**: A funded wallet will be needed for mainnet operations
3. **Consider Studio Subscription**: For production-grade service, upgrading the CHEQD Studio subscription might be necessary

## Development Workflow

During the hackathon:

1. Focus on the app functionality using the mock implementation
2. Store DIDs and credentials in GunDB as planned
3. Implement the moderation and credential logic

The app will function correctly with mocked credentials, which is sufficient for demonstrating the core functionality at the hackathon.

## Working with CHEQD Mocks

The mock implementation stores DIDs and credentials in memory only, but provides all the same functions as the real implementations:

```javascript
// Create a DID
const did = await cheqdApi.createCheqdDID('my-alias');

// Issue a credential
const credential = await cheqdApi.issueCredential(
  issuerDid, 
  subjectDid, 
  { name: 'User', role: 'Moderator' }
);

// Verify a credential
const result = await cheqdApi.verifyCredential(credential);
```

The code will work the same way when we switch to a real implementation later. 