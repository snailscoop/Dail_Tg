# Unified Telegram Bot with DID-Powered Moderation

A unified Telegram bot that combines information retrieval features with a decentralized moderation system powered by cheqd's DID infrastructure and verifiable credentials.

## Overview

This bot provides:

* **Information Retrieval** - Basic commands for getting information and facts
* **Decentralized Identity (DID)** - Automatic DID management for all participants
* **Verifiable Credentials** - For moderators and privileged users
* **Consent-based Moderation** - With transparent audit trails
* **Cross-chat Ban Registry** - For sharing moderation data between groups

## Features

* **Bot Commands:** Various commands for information and fun
* **DID Management:** Creates and manages DIDs for users automatically
* **Credential System:** Issues and verifies moderator credentials
* **Consent Records:** Maintains transparent records of all moderation actions
* **Cross-Chat Bans:** Optional system to share ban information across groups
* **Enhanced Moderation:** Commands like ban and mute with verification

## Getting Started

### Prerequisites

* Node.js v16+ installed
* Telegram Bot Token (from BotFather)

### Installation

1. Clone this repository:
```
git clone https://github.com/snailscoop/Dail_Tg.git
cd Dail_Tg
```

2. Install dependencies:
```
npm install
```

3. Create a local environment file:
```
cp local-env.js.example local-env.js
```

4. Edit `local-env.js` and add your Telegram bot token:
```js
module.exports = {
  TOKEN: 'your_telegram_bot_token_here'
};
```

### Running the Bot

For development environments, use:

```
node start-hackathon.js
```

This script will:
1. Start a local GunDB server for data storage
2. Initialize the Telegram bot with mock cheqd implementation
3. Enable all features with simulated blockchain verification

## Command Reference

### User Commands

* `/start` - Start the bot
* `/help` - Show general help
* `/info` - Display bot information
* `/snailfact` - Get a random snail fact
* `/search [term]` - Search for information
* `/mydid` - Get or create your DID
* `/mycredentials` - View your credentials and privileges
* `/didhelp` - Show DID-related command help

### Moderation Commands

* `/ban @username reason` - Ban a user with consent verification
* `/mute @username reason` - Mute a user for 1 hour with consent
* `/banlist` - View ban records with consent information
* `/makemoderator @username` - Grant moderator credentials to a user
* `/revokemoderator @username` - Revoke moderator privileges from a user
* `/trust @username` - Add a user as a trusted member without full moderator privileges
* `/untrust @username` - Remove a user from the trusted members list
* `/trustedlist` - View all trusted members in this chat
* `/deletemedia` - Delete media message (use as reply to media)

### Cross-Chat Ban System

* `/crossbanstatus` - Check if this chat participates in the system
* `/crossbanoptin` - Opt in to share ban information
* `/crossbanoptout` - Opt out of the system

## Architecture

The system consists of:

1. **Identity Layer:** DIDs and verifiable credentials via cheqd (mocked for development)
2. **Storage Layer:** GunDB for distributed, local-first data storage
3. **Bot Layer:** Telegram bot interface with information and moderation commands
4. **Consent Layer:** Transparent recording of moderation decisions

## Moving to Production

This implementation uses a mock cheqd implementation suitable for development. To move to production:

1. Set up a real cheqd identity using one of:  
   * Veramo SDK integration with cheqd  
   * cheqd Studio API
2. Configure the production environment:  
   * Set `USE_MOCK_CHEQD=false` in environment  
   * Configure proper DID resolution endpoints  
   * Set up appropriate key management
3. Review the documentation in `LIVE-CHEQD-SETUP.md`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

* This project was developed as part of the cheqd Hackathon
* Built on top of the SNAILS Telegram bot framework
* Uses GunDB for peer-to-peer data storage 