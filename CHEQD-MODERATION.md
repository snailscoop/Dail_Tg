# DID-Powered Telegram Moderation System

A decentralized moderation system for Telegram that empowers community members to help moderate chats through verifiable credentials issued by admins. The system uses cheqd's DID infrastructure and GunDB's decentralized storage.

## Overview

This project enhances the SNAILS Telegram bot with a consent-based moderation system built on cheqd's decentralized identity infrastructure. It allows chat administrators to issue verifiable credentials to trusted community members, enabling them to perform moderation actions that are verified, transparent, and auditable.

## Features

### ConsentChain Moderation Framework
- **Consent-Based Moderation**
  - All moderation actions require explicit consent, recorded immutably on cheqd
  - Full audit trail of moderation history with verifiable proofs
  - Transparent moderation actions with consent verification

- **Trusted Delegate System**
  - Admins issue persistent credentials to trusted community members
  - Credentials encoded as verifiable attestations on the cheqd blockchain
  - Each delegation creates an auditable credential record

### GunDB-Powered Storage
- **Unified Storage Architecture**
  - GunDB serving dual role as local cache and decentralized storage
  - Bot instance maintains a local GunDB node
  - Master node for persistent storage and synchronization
  - Resilient operation during network disruptions

- **Cross-Chat Ban Registry**
  - Decentralized registry of known spammers
  - Evidence storage in GunDB with cheqd references
  - Verifiable ban attribution

## Installation

### Prerequisites
- Node.js (v14+)
- Telegram Bot Token
- Access to cheqd network (testnet or mainnet)
- cheqd wallet mnemonic

### Setup

1. Clone the repository:
```bash
git clone https://github.com/snailscoop/Dail_Tg.git
cd Dail_Tg
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp config.example.env .env
```

4. Edit the `.env` file with your credentials:
```
# Telegram Bot Token
TOKEN=your_bot_token_here

# cheqd Network Configuration
CHEQD_NETWORK=testnet
CHEQD_RPC_URL=https://rpc.cheqd.network
CHEQD_MNEMONIC=your_mnemonic_here

# GunDB Configuration
GUNDB_PEERS=http://localhost:3000/gun

# Express Server
PORT=3000
```

### Running the System

1. Start the GunDB master node:
```bash
node gundb-master.js
```

2. In a separate terminal, start the bot:
```bash
node index-with-cheqd.js
```

## Usage

### DID Commands
- `/mydid` - Get or create your DID (Decentralized Identifier)
- `/mycredentials` - View your credentials and privileges
- `/didhelp` - Show help for DID-related commands

### Moderation Commands
- `/ban @username reason` - Ban a user with consent verification
- `/mute @username reason` - Mute a user for 1 hour with consent verification
- `/banlist` - View the list of banned users with their consent records

### Admin Commands
- `/makemoderator @username` - Grant moderator privileges to a user

## Technical Implementation

### cheqd Integration
- Uses cheqd DIDs for all user identities
- Stores moderation consent as verifiable credentials
- Implements credential verification protocols
- Creates a trust registry for verified moderators

### GunDB Implementation
- Decentralized+Local Storage architecture
- Master node + bot peer setup
- End-to-end encryption for stored data
- Permission-based access control

## Hackathon Alignment

This project was created for the SPRITE+ Hackathon and aligns perfectly with the judging criteria:

- **Technical Excellence**: Advanced use of cheqd's DID infrastructure and Veramo SDK
- **Innovation & Impact**: Novel approach to community moderation with consent verification
- **Business Viability**: Enhances existing SNAILS community management with scalable solution

## Contributors

- SNAILS community
- Dail Telegram bot team

## License

ISC 