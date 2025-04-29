# Swapping from Mock to Live cheqd Implementation

This guide explains how to migrate from the hackathon mock implementation to a live cheqd blockchain implementation.

## Overview

The current implementation uses mock functions to simulate cheqd blockchain interactions. To use the real blockchain, you need to:

1. Set up proper credentials
2. Configure environment variables
3. Restart the application

## Prerequisites

- cheqd wallet with funded account
- cheqd Studio API key (if using Studio) or mnemonic (if using Veramo)
- Node.js environment

## Configuration Steps

### Option 1: Using Veramo SDK (Direct Blockchain Integration)

1. **Set up a cheqd wallet**:
   - Create a wallet using the cheqd CLI or web tools
   - Fund the wallet with CHEQ tokens
   - Note the mnemonic phrase

2. **Update environment variables**:
   ```
   # File: local-env.js
   
   # Telegram bot token
   process.env.TOKEN = 'your_telegram_bot_token';
   
   # Disable mock mode
   process.env.USE_MOCK_CHEQD = 'false';
   
   # cheqd configuration
   process.env.CHEQD_NETWORK = 'testnet'; # or 'mainnet' for production
   process.env.CHEQD_RPC_URL = 'https://rpc.cheqd.network';
   process.env.CHEQD_MNEMONIC = 'your wallet mnemonic phrase here';
   
   # Set to production for additional checks
   process.env.NODE_ENV = 'production';
   ```

3. **Install additional dependencies** (if not already installed):
   ```bash
   npm install @cheqd/sdk @cheqd/did-provider-cheqd
   ```

### Option 2: Using cheqd Studio API

1. **Sign up for cheqd Studio**:
   - Visit https://studio.cheqd.io/
   - Create an account and subscribe to a paid plan
   - Generate an API key

2. **Update environment variables**:
   ```
   # File: local-env.js
   
   # Telegram bot token
   process.env.TOKEN = 'your_telegram_bot_token';
   
   # Disable mock mode
   process.env.USE_MOCK_CHEQD = 'false';
   
   # Enable Studio
   process.env.CHEQD_STUDIO_ENABLED = 'true';
   process.env.CHEQD_STUDIO_URL = 'https://studio-api.cheqd.io';
   process.env.CHEQD_STUDIO_API_KEY = 'your_studio_api_key';
   
   # Set to production for additional checks
   process.env.NODE_ENV = 'production';
   ```

## Testing the Implementation

After configuring the environment variables, test the implementation:

1. **Restart the application**:
   ```bash
   node start-hackathon.js
   ```

2. **Check logs**:
   - Look for: "Using Veramo implementation for testnet" or "Using CHEQD Studio API implementation for testnet"
   - Verify no error messages related to cheqd configuration

3. **Test DID creation**:
   - Use `/mydid` command in a Telegram chat
   - Verify the DID is created on the real blockchain by checking the cheqd explorer

## Troubleshooting

If you encounter issues:

1. **Error: "CHEQD_MNEMONIC is required"**:
   - Make sure the mnemonic is set in your local-env.js file
   - Verify the mnemonic is valid and funded

2. **Error: "CHEQD_STUDIO_API_KEY is required"**:
   - Make sure the API key is set in your local-env.js file
   - Verify the API key is valid and your subscription is active

3. **Transaction errors**:
   - Check your wallet has sufficient funds for transactions
   - Verify the network configuration (testnet/mainnet)

## Production Considerations

For production deployment:

1. **Use secure environment variable storage** instead of local-env.js
2. **Set up monitoring** for blockchain interactions
3. **Implement retry mechanisms** for failed transactions
4. **Use mainnet** instead of testnet
5. **Set up proper backup** for wallet mnemonics

## Need Help?

For issues with cheqd integration:
- Visit the cheqd documentation: https://docs.cheqd.io/
- Join the cheqd community: https://cheqd.io/community 