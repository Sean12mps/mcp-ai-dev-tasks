#!/usr/bin/env node

const MCPServer = require('./src/mcp-server');

// Initialize and start the MCP server
const server = new MCPServer();

// Handle process termination gracefully
process.on('SIGINT', () => {
  server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.shutdown();
  process.exit(0);
});

// Start the server
server.start(); 