/**
 * CHEQD Configuration
 * 
 * This module provides configuration for the cheqd integration.
 * It can be configured for mock mode (for development/hackathon),
 * testnet, or mainnet.
 */

// Environment variables with defaults
const env = {
  network: process.env.CHEQD_NETWORK || 'testnet',
  rpcUrl: process.env.CHEQD_RPC_URL || 'https://rpc.cheqd.network',
  mnemonic: process.env.CHEQD_MNEMONIC || '',
  useMock: process.env.USE_MOCK_CHEQD === 'true' || true, // Default to mock for hackathon
};

// CHEQD configuration
const cheqdConfig = {
  network: env.network,
  rpcUrl: env.rpcUrl,
  mnemonic: env.mnemonic,
};

// CHEQD Studio configuration
const studioConfig = {
  enabled: process.env.CHEQD_STUDIO_ENABLED === 'true' || false,
  baseUrl: process.env.CHEQD_STUDIO_URL || 'https://studio-api.cheqd.io',
  apiKey: process.env.CHEQD_STUDIO_API_KEY || '',
};

// GunDB configuration
const gundbConfig = {
  port: parseInt(process.env.GUNDB_PORT || '3000', 10),
  peers: (process.env.GUNDB_PEERS || 'http://localhost:3000/gun').split(',')
};

// Master configuration object
const config = {
  token: process.env.TOKEN,
  cheqd: cheqdConfig,
  cheqdStudio: studioConfig,
  gundb: gundbConfig,
  useMock: env.useMock,
  
  // Add production flag (for future use when switching from mock to real)
  isProduction: process.env.NODE_ENV === 'production',
  
  // Configuration for swapping to live implementation
  implementation: {
    // Set to 'mock', 'studio', or 'veramo'
    type: env.useMock ? 'mock' : (studioConfig.enabled ? 'studio' : 'veramo'),
    
    // Configuration for easy swapping
    swap: {
      // Steps to swap from mock to live:
      // 1. Set USE_MOCK_CHEQD=false
      // 2. Ensure CHEQD_MNEMONIC is set for Veramo or CHEQD_STUDIO_API_KEY for Studio
      // 3. Set CHEQD_NETWORK to 'testnet' or 'mainnet'
      // 4. Restart the application
      
      // Set this to true when ready to swap
      enabled: !env.useMock,
      
      // Target implementation when swapping
      target: studioConfig.enabled ? 'studio' : 'veramo'
    }
  }
};

/**
 * Validate the configuration
 * @throws {Error} If configuration is invalid
 */
function validateConfig() {
  if (config.implementation.type === 'mock') {
    console.log('Using MOCK implementation for cheqd (suitable for hackathon/development)');
    return;
  }
  
  if (config.implementation.type === 'studio') {
    if (!config.cheqdStudio.apiKey) {
      throw new Error('CHEQD_STUDIO_API_KEY is required for Studio implementation');
    }
    console.log(`Using CHEQD Studio API implementation for ${config.cheqd.network}`);
    return;
  }
  
  if (config.implementation.type === 'veramo') {
    if (!config.cheqd.mnemonic) {
      throw new Error('CHEQD_MNEMONIC is required for Veramo implementation');
    }
    console.log(`Using Veramo implementation for ${config.cheqd.network}`);
    return;
  }
}

module.exports = {
  ...config,
  validateConfig
}; 