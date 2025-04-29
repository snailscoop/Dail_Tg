# DID-Powered Telegram Moderation System: Project Scope

## Project Overview
We're enhancing the existing SNAILS Telegram bot with decentralized moderation capabilities using cheqd's DID infrastructure. This will allow community members to assist with moderation through verifiable credentials, creating a consent-based system that's transparent and auditable.

## Core Components

### 1. Identity Infrastructure
- **Technology**: cheqd's DID infrastructure via Veramo SDK
- **Dependencies**: 
  - `@cheqd/did-provider-cheqd`: Core cheqd integration for Veramo
  - `@cheqd/sdk`: Base SDK for cheqd interactions
  - `@veramo/core`: Core Veramo functionality
  - `@veramo/credential-w3c`: W3C Verifiable Credentials support
  - `@veramo/did-manager`: DID management capabilities
  - `@veramo/key-manager`: Cryptographic key management
  - `@veramo/kms-local`: Local key management system
  - `@veramo/data-store`: Data storage for Veramo

### 2. Decentralized Storage
- **Technology**: GunDB (peer-to-peer database)
- **Dependencies**: 
  - `gun`: Core GunDB functionality
  - Architecture: Master node + bot instance as peer

### 3. Telegram Integration
- **Technology**: Existing SNAILS Telegram bot
- **Dependencies**: 
  - `node-telegram-bot-api`: Telegram Bot API wrapper
  - `dotenv`: Environment variable management

### 4. Consent Management
- **Implementation**: Custom consent records using cheqd DIDs
- **Storage**: GunDB for consent records and credential references

## Functional Scope

### 1. Identity Management
- Create DIDs for chat administrators
- Create DIDs for trusted community members
- Issue moderator credentials to trusted members

### 2. Consent-Based Moderation
- Moderator action proposal system
- Consent verification for moderation actions
- Transparent audit trails of all actions

### 3. Credential System
- Admin-issued moderator credentials
- Credential verification before moderation actions
- Credential revocation capabilities

### 4. Decentralized Storage
- Persistent storage of credentials and consent records
- Synchronization between nodes
- Local-first operations with background sync

### 5. Cross-Chat Ban Registry
- Shared registry of known spammers
- Opt-in system for shared moderation
- Evidence storage with references to DIDs

## Technical Architecture

### 1. Data Flow
1. Admin creates DIDs and issues credentials to trusted moderators
2. Moderators propose actions with their credentials
3. System verifies credentials against cheqd network
4. Consent records are stored in GunDB
5. Moderation actions are taken with full audit trail

### 2. Storage Architecture
- Master GunDB node for persistence
- Bot instance as GunDB peer for local caching
- Eventual consistency model for synchronization

### 3. Integration Points
- Extend existing SNAILS bot with moderation commands
- Add credential verification to existing command handlers
- Provide admin interfaces for credential management

## Out of Scope
- End-user wallet integration (future enhancement)
- Full Web3 profile system (future enhancement)
- Complex governance mechanisms (future enhancement)
- Mobile app development

## Hackathon Alignment

### Technical Excellence
- Advanced use of cheqd's DID infrastructure
- Integration of Veramo SDK for credential management
- Distributed storage with GunDB

### Innovation & Impact
- Novel approach to community moderation
- Transparent consent-based governance
- Auditable moderation decisions

### Business Viability
- Enhances existing SNAILS community management
- Scalable to any Telegram community
- Clear path to additional features 