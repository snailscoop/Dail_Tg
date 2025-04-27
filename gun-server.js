// Simple Gun server
const Gun = require('gun');
const port = 8765;

// Initialize the Gun server
console.log(`Starting Gun server on port ${port}`);
const server = require('http').createServer().listen(port);
const gun = Gun({
  web: server,
  file: 'gun-data'
});

console.log('Gun server running. Press Ctrl+C to exit.'); 