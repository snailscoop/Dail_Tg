# CHEQD Studio Setup Guide

This guide explains how to set up and configure CHEQD Studio integration for the Telegram bot.

## Overview

The project can use either:
1. Direct blockchain integration (via Veramo SDK)
2. CHEQD Studio REST API integration

CHEQD Studio provides additional features like trust registries, status lists, and more.

## Setup Steps

### 1. Create a CHEQD Studio Account

1. Visit [CHEQD Studio](https://studio-api.cheqd.net/swagger/) and create an account
2. Login to your account and navigate to the API keys section
3. Create a new API key with appropriate permissions (at minimum, DID and credential operations)

### 2. Configure the API Key

Update your local-env.js file with the API key:

```javascript
process.env.CHEQD_STUDIO_API_KEY = 'your_api_key_here'; // Replace with your actual API key
```

### 3. API Authentication

CHEQD Studio uses API key authentication:
- Key should be provided in the `x-api-key` header (already configured in the code)
- The key needs appropriate permissions for the operations you want to perform

### 4. Testing the Integration

Run the test script to verify your API key works:

```bash
node test-api-key.js
```

If issues persist, check:
1. API key format and validity
2. Permissions assigned to the key
3. Network settings (testnet vs mainnet)

### 5. Additional Configuration Options

CHEQD Studio provides advanced configuration options:

- External database support
- Custom authentication methods
- Self-custodied key management (Client-managed mode)

For more details, refer to the CHEQD Studio documentation.

## Switching Between Integration Methods

The application automatically chooses the integration method based on the presence of a valid API key in the configuration. If no key is provided, it falls back to direct blockchain integration.

If you need to force one method or the other, modify the `enabled` flag in `/cheqd/config.js`. 