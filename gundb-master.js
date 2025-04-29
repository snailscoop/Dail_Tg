/**
 * GunDB Master Node
 * 
 * This script runs a standalone GunDB master node that serves as the
 * persistent storage and synchronization point for the bot peers.
 */

// Load environment variables
require('dotenv').config();

// Import GunDB storage module
const storage = require('./storage/gundb');
const config = require('./cheqd/config');

// Validate configuration
config.validateConfig();

console.log('Starting GunDB master node...');
console.log(`Listening on port: ${config.gundb.port}`);

// Initialize the GunDB master node
const gun = storage.initMasterNode();

console.log('GunDB master node initialized');
console.log('Peer URL:', `http://localhost:${config.gundb.port}/gun`);
console.log('Press Ctrl+C to stop');

// Handle shutdown
process.on('SIGINT', () => {
  console.log('Shutting down GunDB master node...');
  process.exit(0);
}); 