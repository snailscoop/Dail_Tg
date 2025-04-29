# CHEQD Studio API Summary

## Overview

This document summarizes our findings regarding the CHEQD Studio API, based on exploratory testing conducted with the API key.

## Account Information

The account is registered under the name "SNAILS." with customer ID `ca18c7cd-148e-48fa-a4a6-671469c55c97`.

Payment addresses:
- Mainnet: `cheqd1n89ar4vswx3ntr5ulk3vgpjuxfd72n8pdhwd7f`
- Testnet: `cheqd1j83hg85ejlsxsxjv0a56c0gzftvaeryuy5qf7p`

## Discovered API Endpoints

Based on Swagger UI documentation and testing:

### Currently Accessible
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/account` | GET | ✅ Working | Returns account information including customer details and payment addresses |

### Available with Subscription Upgrade
| Endpoint | Method | Status | Description |
|----------|--------|--------|-------------|
| `/account/create` | POST | ❌ 403 | Create an account client |
| `/key/create` | POST | ❌ 403 | Create an identity key pair |
| `/key/import` | POST | ❌ 403 | Import an identity key pair |
| `/key/read/{kid}` | GET | ❌ 403 | Fetch an identity key pair |
| `/did/create` | POST | ❌ 403 | Create a DID Document |
| `/did/update` | POST | ❌ 403 | Update a DID Document |
| `/did/import` | POST | ❌ 403 | Import a DID Document |
| `/did/deactivate/{did}` | POST | ❌ 403 | Deactivate a DID Document |
| `/did/list` | GET | ❌ 403 | Fetch DIDs associated with account |
| `/did/search/{did}` | GET | ❌ 403 | Resolve a DID Document |
| `/resource/create/{did}` | POST | ❌ 403 | Create a DID-Linked Resource |
| `/resource/search/{did}` | GET | ❌ 403 | Get a DID-Linked Resource |
| `/credential/issue` | POST | ❌ 403 | Issue a Verifiable Credential |
| `/credential/verify` | POST | ❌ 403 | Verify a Verifiable Credential |
| `/credential/revoke` | POST | ❌ 403 | Revoke a Verifiable Credential |
| `/credential/suspend` | POST | ❌ 403 | Suspend a Verifiable Credential |
| `/credential/reinstate` | POST | ❌ 403 | Reinstate a suspended Verifiable Credential |

## Account Capabilities

The current account has **basic capabilities only**. The account:

- ✅ Can retrieve account information
- ❌ Cannot create DIDs (requires subscription upgrade)
- ❌ Cannot manage keys, issue or verify credentials (requires subscription upgrade)

## Recommended Next Steps

1. **Upgrade Subscription**: To enable DID creation and other functionality, upgrade the CHEQD Studio subscription.

2. **Consider Alternative Solution**: If subscription upgrade is not feasible, consider alternatives:
   - Use the direct CHEQD network integration with a funded wallet
   - Use another SSI provider
   - Implement a mock/stub for development purposes

3. **Contact CHEQD Support**: For subscription options and detailed API documentation, contact CHEQD support with the customer ID.

## API Client Usage

Our `cheqd/api/studio.js` client provides the following functions:

```javascript
// Get account information
const accountInfo = await studioApi.getAccountInfo();

// Check if the account can create DIDs
const canCreate = await studioApi.canCreateDids();

// Create a DID (requires subscription upgrade)
const did = await studioApi.createDid({
  network: 'testnet',
  method: 'cheqd'
});
```

## Configuration

Make sure to configure the API client properly in `cheqd/config.js`:

```javascript
cheqdStudio: {
  apiKey: process.env.CHEQD_STUDIO_API_KEY,
  baseUrl: 'https://studio-api.cheqd.net', // Base URL without /v1
  enabled: Boolean(process.env.CHEQD_STUDIO_API_KEY)
}
``` 