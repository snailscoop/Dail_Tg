/**
 * Local Environment Configuration
 * 
 * This file provides environment variables for local development.
 * In production, use actual environment variables or .env file.
 */

// Set environment variables
process.env.TOKEN = '7341570819:AAF8BB-bXj2Vt3qCyUkQEDd_E9B4ib4cJ7o'; // Replace with your new Telegram bot token
process.env.CHEQD_NETWORK = 'testnet';
process.env.CHEQD_RPC_URL = 'https://rpc.cheqd.network';
process.env.CHEQD_MNEMONIC = 'capable parent permit subject thought rotate siren smoke you idea treat mammal'; // Replace with your cheqd wallet mnemonic
process.env.CHEQD_STUDIO_API_KEY = 'caas_09c6c8a5f534fac2975188b1a0e2f1686db1406dce7443ab84d8df77dfe039ef551bf9a7849f01e7b9e7daca4d02ae51fb9b9e3dd3695617eec348b3463b26e0'; // Replace with your CHEQD Studio API key
process.env.GUNDB_PEERS = 'http://localhost:3000/gun';
process.env.PORT = '3000';

// Export for use in other files
module.exports = {
  TOKEN: process.env.TOKEN,
  CHEQD_NETWORK: process.env.CHEQD_NETWORK,
  CHEQD_RPC_URL: process.env.CHEQD_RPC_URL,
  CHEQD_MNEMONIC: process.env.CHEQD_MNEMONIC,
  CHEQD_STUDIO_API_KEY: process.env.CHEQD_STUDIO_API_KEY,
  GUNDB_PEERS: process.env.GUNDB_PEERS,
  PORT: parseInt(process.env.PORT, 10)
}; 