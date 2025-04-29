import { initMasterNode } from './storage/gundb';
import { ENV } from './config/env.example';

// Load environment variables if needed
try {
  require('dotenv').config();
} catch (e) {
  console.log('No .env file found, using defaults');
}

console.log('Starting GunDB master node...');
console.log(`Listening on port: ${ENV.PORT}`);

// Initialize the GunDB master node
const gun = initMasterNode();

console.log('GunDB master node initialized');
console.log('Press Ctrl+C to stop');

// Handle shutdown
process.on('SIGINT', () => {
  console.log('Shutting down GunDB master node...');
  process.exit(0);
}); 