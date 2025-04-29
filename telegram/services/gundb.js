/**
 * GunDB Service proxy file
 * This file is just a proxy to the main GunDB implementation
 * to make imports cleaner from the services directory
 */

// Import the main GunDB module
const gundb = require('../../storage/gundb');

// Re-export all the functions
module.exports = gundb; 