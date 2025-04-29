# DID-Powered Telegram Moderation System

A decentralized moderation system for Telegram groups using cheqd's DID infrastructure and verifiable credentials. This implementation uses a mock cheqd setup suitable for hackathons and development.

## Overview

This bot enhances Telegram group moderation with:

- **Decentralized Identity (DID)** for all participants
- **Verifiable Credentials** for moderators
- **Consent-based moderation** with transparent audit trails
- **Cross-chat ban registry** for sharing moderation data

## Features

- **DID Management:** Creates and manages DIDs for users automatically
- **Credential System:** Issues and verifies moderator credentials
- **Consent Records:** Maintains transparent records of all moderation actions
- **Cross-Chat Bans:** Optional system to share ban information across groups
- **Moderation Commands:** Enhanced ban and mute commands with verification

## Getting Started

### Prerequisites

- Node.js v16+ installed
- Telegram Bot Token (from BotFather)

### Installation

1. Clone this repository:
```bash
git clone <repository-url>
cd telegram-moderation-bot
```

2. Install dependencies:
```bash
npm install
```

3. Create a local environment file:
```bash
cp local-env.example.js local-env.js
```

4. Edit `local-env.js` and add your Telegram bot token:
```javascript
module.exports = {
  TOKEN: 'your_telegram_bot_token_here'
};
```

### Running the Bot

For hackathon or development environments, use:

```bash
node start-hackathon.js
```

This script will:
1. Start a local GunDB server for data storage
2. Initialize the Telegram bot with mock cheqd implementation
3. Enable all moderation features with simulated blockchain verification

## Command Reference

### User Commands

- `/mydid` - Get or create your DID
- `/mycredentials` - View your credentials and privileges
- `/didhelp` - Show DID-related command help
- `/help` - Show general help

### Moderation Commands

- `/ban @username reason` - Ban a user with consent verification
- `/mute @username reason` - Mute a user for 1 hour with consent
- `/banlist` - View ban records with consent information

### Admin Commands

- `/makemoderator @username` - Grant moderator credentials to a user

### Cross-Chat Ban System

- `/crossbanstatus` - Check if this chat participates in the system
- `/crossbanoptin` - Opt in to share ban information
- `/crossbanoptout` - Opt out of the system

## Architecture

The system consists of:

1. **Identity Layer:** DIDs and verifiable credentials via cheqd (mocked)
2. **Storage Layer:** GunDB for distributed, local-first data storage
3. **Bot Layer:** Telegram bot interface with moderation commands
4. **Consent Layer:** Transparent recording of moderation decisions

## Moving to Production

This implementation uses a mock cheqd implementation suitable for hackathons and development. To move to production:

1. Set up a real cheqd identity using one of:
   - Veramo SDK integration with cheqd
   - cheqd Studio API

2. Configure the production environment:
   - Set `USE_MOCK_CHEQD=false` in environment
   - Configure proper DID resolution endpoints
   - Set up appropriate key management

3. Review the documentation in `LIVE-CHEQD-SETUP.md`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- This project was developed as part of the cheqd Hackathon
- Built on top of the SNAILS Telegram bot framework
- Uses GunDB for peer-to-peer data storage 