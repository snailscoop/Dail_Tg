/**
 * Instance Service
 * 
 * This service manages shared instances across the application,
 * allowing components to access the same bot and GunDB instances.
 */

// Singleton instances
let botInstance = null;
let gunInstance = null;

/**
 * Initialize service instances
 * @param {Object} options - The service instances { bot, gun }
 * @returns {Object} The initialized services
 */
function initializeInstances(options = {}) {
  if (options.bot) {
    botInstance = options.bot;
  }
  
  if (options.gun) {
    gunInstance = options.gun;
  }
  
  return { bot: botInstance, gun: gunInstance };
}

/**
 * Get the service instances
 * @returns {Object} The service instances { bot, gun }
 */
function getInstances() {
  return { bot: botInstance, gun: gunInstance };
}

/**
 * Clear service instances (useful for testing)
 */
function clearInstances() {
  botInstance = null;
  gunInstance = null;
}

module.exports = {
  initializeInstances,
  getInstances,
  clearInstances
}; 