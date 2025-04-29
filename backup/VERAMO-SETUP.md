# Setting Up Veramo with CHEQD for the Hackathon

## Overview

For the hackathon, we're using Veramo directly to interact with the CHEQD network instead of CHEQD Studio API, which requires a paid subscription for DID creation.

## Requirements

You need to set up the following for the application to work properly:

1. A CHEQD mnemonic for a funded wallet
2. Proper environment configuration

## Setting Up Your CHEQD Mnemonic

### Option 1: Create a new CHEQD wallet

1. You can create a new CHEQD wallet using the [CHEQD wallet CLI](https://docs.cheqd.io/node/getting-started/cheqd-cli)
2. Install cheqd-node:
   ```bash
   git clone https://github.com/cheqd/cheqd-node.git
   cd cheqd-node
   make install
   ```

3. Create a new wallet:
   ```bash
   cheqd-noded keys add my-cheqd-wallet --keyring-backend test
   ```

4. This will display your mnemonic. **Save this mnemonic** - you'll need it for the environment variables.

### Option 2: Use a test mnemonic (for testnet only)

If this is just for testing/hackathon purposes, you can use this sample mnemonic:
```
erosion soda nest butter sudden pear rocket ordinary gentle rhythm setup toilet swear raise nasty cactus razor strategy memory system turtle eight web banner pull
```

⚠️ **IMPORTANT**: Do not use this mnemonic for production or with real funds. It's for testing only!

## Setting Up Environment Variables

1. Create a `.env` file in the root directory by copying the example:
   ```bash
   cp config.example.env .env
   ```

2. Edit the `.env` file and add your mnemonic:
   ```
   # Telegram Bot Token
   TOKEN=your_bot_token_here

   # cheqd Network Configuration
   CHEQD_NETWORK=testnet
   CHEQD_RPC_URL=https://rpc.cheqd.network
   CHEQD_MNEMONIC=your_mnemonic_here  # Replace with your actual mnemonic
   
   # GunDB Configuration
   GUNDB_PEERS=https://gun-peer.example.com/gun
   
   # Express Server (if needed)
   PORT=3000
   ```

3. Replace `your_mnemonic_here` with the mnemonic you generated or the test mnemonic provided above.

## Testing Your Setup

After setting up the mnemonic, run the test script to verify it works:

```bash
node test-veramo-did.js
```

If successful, you should see output showing:
- A DID being created
- A credential being issued 
- The credential being verified

## Troubleshooting

- **Error: CHEQD_MNEMONIC is not set**: Make sure you've added the mnemonic to your `.env` file and the application is loading it correctly.
- **RPC Connection Errors**: If you have issues connecting to the CHEQD network, try changing the RPC URL in the `.env` file.
- **Invalid Mnemonic**: Ensure your mnemonic has the correct number of words (usually 24) and is properly formatted.

## Resources

- [CHEQD Documentation](https://docs.cheqd.io/)
- [Veramo Documentation](https://veramo.io/docs/veramo_agent/introduction)
- [DID Creation Guide](https://docs.cheqd.io/identity/guides/did/create-did) 