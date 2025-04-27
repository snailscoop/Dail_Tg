# Dail TG Moderator

A React TypeScript frontend for the Telegram bot moderation system with DataTrust Vault (Verida), ConsentChain (Cheqd), and Gun server for decentralized storage.

## Features

- Secure credential linking with Telegram IDs
- Decentralized moderation capabilities through verified credentials
- Consent management for moderation actions
- Integration with Gun server for decentralized data storage
- Integration with Verida for secure credential storage
- Integration with Cheqd for verifiable credentials

## Prerequisites

- Node.js (v16 or later)
- npm or yarn
- FastAPI backend running (see backend setup below)
- Gun server running for decentralized storage

## Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd dail-tg
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create an `.env` file in the root directory with the following variables:
   ```
   REACT_APP_API_URL=http://localhost:8000
   REACT_APP_GUN_PEERS=http://localhost:8765/gun
   ```

4. Start the development server
   ```bash
   npm start
   ```

## Usage

### Linking Your Credential

1. Navigate to the "Link Credential" page
2. Enter your linking code and Telegram ID
3. Submit the form to link your credential to your Telegram account

### Managing Moderation Actions

1. Navigate to the "Moderation" page
2. Enter the target user, action, and reason
3. Submit the form to request consent for the action
4. Check the "Consent Requests" page to see pending consents

### Managing Consent Requests

1. Navigate to the "Consent Requests" page
2. View all pending consent requests
3. Approve or deny consent requests as needed

## Backend Setup

The frontend requires the FastAPI backend to be running. Follow these steps to set up the backend:

1. Install backend dependencies
   ```bash
   pip install fastapi uvicorn requests python-telegram-bot verida gun
   ```

2. Set up the environment variables
   ```
   CHEQD_API_KEY=your_cheqd_api_key
   VERIDA_PRIVATE_KEY=your_verida_private_key
   ```

3. Run the Gun server
   ```bash
   # Ensure Gun is running at http://localhost:8765/gun
   ```

4. Run the FastAPI backend
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 8000
   ```

## Architecture

- **React Frontend**: Provides UI for linking credentials and performing moderation actions
- **FastAPI Backend**: Manages credential issuance, verification, consent recording, and linking code management
- **Gun Server**: Stores linking codes and consent records in a decentralized manner
- **Cheqd APIs**: Issue and verify credentials for moderation and consent
- **Verida SDK**: Securely stores credentials and consent data with user approval

## License

ISC

## Contact

For any questions or support, please contact the project maintainer.
