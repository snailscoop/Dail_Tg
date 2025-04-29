/**
 * Enhanced GunDB Server
 * 
 * This is a standalone GunDB server for the cheqd moderation system.
 * It provides a peer-to-peer database for storing DIDs, credentials,
 * and moderation records.
 */

const Gun = require('gun');
require('gun/sea');
const http = require('http');
const gundb = require('./storage/gundb');

// Load configuration
let config;
try {
  const localEnv = require('./local-env.js');
  config = {
    port: localEnv.GUNDB_PORT || 3000,
    host: localEnv.GUNDB_HOST || 'localhost'
  };
  console.log('Using local environment configuration for GunDB server');
} catch (error) {
  console.log('Local environment not found, using default configuration');
  config = {
    port: process.env.GUNDB_PORT || 3000,
    host: process.env.GUNDB_HOST || 'localhost'
  };
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Health check endpoint
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      uptime: process.uptime(),
      timestamp: Date.now()
    }));
    return;
  }
  
  if (req.url === '/') {
    // Simple status page
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>GunDB Server</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #333; }
            .status { padding: 10px; background: #eeffee; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>GunDB Server</h1>
          <div class="status">
            <p>Server is running</p>
            <p>Uptime: ${Math.floor(process.uptime())} seconds</p>
            <p>Started at: ${new Date(Date.now() - process.uptime() * 1000).toISOString()}</p>
          </div>
        </body>
      </html>
    `);
    return;
  }
  
  // Default handler for other URLs
  res.writeHead(404);
  res.end('Not found');
});

// Initialize GunDB with the server
const gun = Gun({
  web: server,
  file: 'radata',
  radisk: true,
  multicast: false, // Disable multicast for production
  axe: false // Disable DHT for production
});

// Add error handlers
gun.on('error', err => {
  console.error('GunDB error:', err);
});

// Start server
server.listen(config.port, config.host, () => {
  console.log(`GunDB server running at http://${config.host}:${config.port}`);
  console.log('Use Ctrl+C to stop server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down GunDB server...');
  server.close(() => {
    console.log('Server shutdown complete');
    process.exit(0);
  });
});

// Export the gun instance for direct use if needed
module.exports = gun; 