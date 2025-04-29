# CHEQD Telegram Bot Hackathon Setup

## Project Overview

This project integrates a Telegram Bot with CHEQD DIDs and Verifiable Credentials for moderation purposes. For the hackathon, we're using a mock implementation of CHEQD to avoid subscription costs and blockchain complexity.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A Telegram Bot Token

## Quick Start

1. Clone the repository (if you haven't already):
   ```bash
   git clone <repository-url>
   cd telegram\ 2
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables:
   ```bash
   # Run the setup script to create a .env file
   node setup-hackathon-env.js
   ```
   
   Or manually copy the example config:
   ```bash
   cp config.example.env .env
   ```
   
   Then edit the `.env` file to add your Telegram Bot Token:
   ```
   TOKEN=your_telegram_bot_token_here
   ```

4. Start the project:
   ```bash
   # Use the startup script to run both the GunDB server and Telegram bot
   node start-hackathon.js
   ```

## Project Components

The project consists of two main components:

1. **GunDB Server** (`gun-server.js`):
   - Provides decentralized storage for DIDs and credentials
   - Runs on port 3000 by default
   - Web interface available at http://localhost:3000

2. **Telegram Bot** (`index-with-cheqd.js`):
   - Handles Telegram commands and interactions
   - Creates DIDs and issues credentials for moderation
   - Uses the mock CHEQD implementation for the hackathon

## Running Individual Components

If you need to run the components separately:

1. **GunDB Server**:
   ```bash
   node gun-server.js
   ```

2. **Telegram Bot**:
   ```bash
   # Set environment variable to use mock implementation
   export USE_MOCK_CHEQD=true
   
   # Run the bot
   node index-with-cheqd.js
   ```

## Testing

To verify that the CHEQD mock implementation is working correctly:

```bash
node test-veramo-did.js
```

This should create a mock DID, issue a credential, and verify it.

## Available Telegram Commands

Users can interact with the bot using these commands:

- `/help` - Get general help information
- `/didhelp` - Get help with DID-based moderation commands
- `/mydid` - Create or display your DID
- `/mycredentials` - View your credentials
- `/makemoderator @username` - Make someone a moderator (admin only)
- `/ban @username` - Ban a user (moderators only)
- `/mute @username` - Mute a user (moderators only)
- `/banlist` - View the list of banned users

## Troubleshooting

- **GunDB Connection Issues**: Make sure the GunDB server is running before starting the Telegram bot.
- **Telegram Bot Not Responding**: Check that your Telegram Bot Token is correctly set in the `.env` file.
- **CHEQD Errors**: For the hackathon, we're using a mock implementation, so you shouldn't encounter blockchain-related errors.

## Post-Hackathon

After the hackathon, if you want to implement the real CHEQD integration:

1. Set up a funded CHEQD wallet
2. Update the `.env` file with your CHEQD mnemonic
3. Set `USE_MOCK_CHEQD=false` in your environment
4. Or upgrade to the CHEQD Studio paid plan and enable it in the config 