// MCP Server implementation
// This will handle the Model Context Protocol communication

const { appendString } = require('./tools/append-string');

class MCPServer {
  constructor() {
    this.tools = new Map();
    this.isRunning = false;
    this.initialize();
  }

  initialize() {
    this.registerTool('append-string', {
      description: 'Reads create-prd.md and appends a string to it',
      inputSchema: {
        type: 'object',
        properties: {
          stringToAppend: {
            type: 'string',
            description: 'The string to append to the create-prd.md content',
            minLength: 1,
            maxLength: 10000
          }
        },
        required: ['stringToAppend']
      },
      metadata: {
        version: '1.0.0',
        author: 'ai-dev-tasks',
        category: 'file-processing',
        tags: ['string', 'append', 'markdown', 'file'],
        capabilities: ['file-reading', 'string-processing', 'content-combination']
      }
    });
  }

  registerTool(name, config) {
    if (this.tools.has(name)) {
      throw new Error(`Tool '${name}' is already registered`);
    }

    this.tools.set(name, {
      name,
      description: config.description,
      inputSchema: config.inputSchema,
      metadata: config.metadata || {}
    });

    console.log(`Tool '${name}' registered successfully with metadata:`, config.metadata || 'none');
  }

  unregisterTool(name) {
    if (!this.tools.has(name)) {
      throw new Error(`Tool '${name}' is not registered`);
    }

    this.tools.delete(name);
    console.log(`Tool '${name}' unregistered successfully`);
  }

  getTool(name) {
    return this.tools.get(name);
  }

  getAllTools() {
    return Array.from(this.tools.values());
  }

  getToolCount() {
    return this.tools.size;
  }

  getToolDetails(name) {
    const tool = this.getTool(name);
    if (!tool) {
      return null;
    }
    
    return {
      ...tool,
      registrationTime: new Date().toISOString(),
      serverStatus: this.isRunning ? 'running' : 'stopped'
    };
  }

  getAllToolDetails() {
    return this.getAllTools().map(tool => this.getToolDetails(tool.name));
  }

  isServerRunning() {
    return this.isRunning;
  }

  async handleRequest(request) {
    try {
      // Validate request structure
      if (!request || typeof request !== 'object') {
        return this.createErrorResponse(null, 'Invalid request: must be an object', -32600);
      }

      const { method, params, id } = request;

      // Validate required fields
      if (!method || typeof method !== 'string') {
        return this.createErrorResponse(id, 'Invalid request: method must be a string', -32600);
      }

      if (id === undefined || id === null) {
        return this.createErrorResponse(null, 'Invalid request: id is required', -32600);
      }

      // Handle different methods
      switch (method) {
        case 'tools/list':
          return this.handleToolsList(id);
        case 'tools/call':
          if (!params || typeof params !== 'object') {
            return this.createErrorResponse(id, 'Invalid request: params must be an object', -32600);
          }
          return this.handleToolCall(params, id);
        default:
          return this.createErrorResponse(id, `Method '${method}' not found`, -32601);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      return this.createErrorResponse(request?.id, `Internal error: ${error.message}`, -32603);
    }
  }

  handleToolsList(id) {
    const tools = this.getAllTools().map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      metadata: tool.metadata
    }));

    console.log(`Returning ${tools.length} tools for discovery with metadata`);

    return {
      jsonrpc: '2.0',
      id,
      result: { tools }
    };
  }

  async handleToolCall(params, id) {
    try {
      const { name, arguments: args } = params;

      // Validate tool name
      if (!name || typeof name !== 'string') {
        return this.createErrorResponse(id, 'Invalid request: tool name must be a string', -32600);
      }

      // Check if tool exists
      if (!this.tools.has(name)) {
        return this.createErrorResponse(id, `Tool '${name}' not found`, -32601);
      }

      // Validate arguments
      if (!args || typeof args !== 'object') {
        return this.createErrorResponse(id, 'Invalid request: arguments must be an object', -32600);
      }

      // Get tool configuration
      const tool = this.getTool(name);
      
      // Validate required parameters
      if (tool.inputSchema && tool.inputSchema.required) {
        for (const requiredParam of tool.inputSchema.required) {
          if (!(requiredParam in args)) {
            return this.createErrorResponse(id, `Missing required parameter: ${requiredParam}`, -32602);
          }
        }
      }

      let result;
      switch (name) {
        case 'append-string':
          if (typeof args.stringToAppend !== 'string') {
            return this.createErrorResponse(id, 'Invalid parameter: stringToAppend must be a string', -32602);
          }
          result = await appendString(args.stringToAppend);
          break;
        default:
          return this.createErrorResponse(id, `Tool '${name}' not implemented`, -32601);
      }

      // Handle the new MCP response format
      if (result && typeof result === 'object' && result.content !== undefined) {
        // New format with metadata
        return {
          jsonrpc: '2.0',
          id,
          result: result
        };
      } else {
        // Legacy format - wrap in content field
        return {
          jsonrpc: '2.0',
          id,
          result: { content: result }
        };
      }
    } catch (error) {
      console.error(`Error in tool call '${params?.name}':`, error);
      return this.createErrorResponse(id, `Tool execution error: ${error.message}`, -32603);
    }
  }

  createErrorResponse(id, message, code) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code,
        message
      }
    };
  }

  async processMessage(message) {
    try {
      // Validate message
      if (!message || typeof message !== 'string') {
        const errorResponse = this.createErrorResponse(null, 'Invalid message format', -32700);
        this.sendResponse(errorResponse);
        return;
      }

      const request = JSON.parse(message);
      
      // Validate JSON-RPC version
      if (!request.jsonrpc || request.jsonrpc !== '2.0') {
        this.sendResponse(this.createErrorResponse(request?.id, 'Invalid JSON-RPC version', -32600));
        return;
      }
      
      const response = await this.handleRequest(request);
      this.sendResponse(response);
    } catch (error) {
      console.error('Error processing message:', error);
      
      let errorResponse;
      if (error instanceof SyntaxError) {
        // JSON parse error
        errorResponse = this.createErrorResponse(null, 'Parse error: Invalid JSON', -32700);
      } else {
        // Other errors
        errorResponse = this.createErrorResponse(null, `Internal error: ${error.message}`, -32603);
      }
      
      this.sendResponse(errorResponse);
    }
  }

  sendResponse(response) {
    if (response) {
      const message = JSON.stringify(response) + '\n';
      process.stdout.write(message);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('MCP Server is already running');
      return;
    }

    console.log(`MCP Server initialized with ${this.getToolCount()} tool(s):`, this.getAllTools().map(t => t.name));
    
    this.isRunning = true;
    
    // Set up stdin/stdout communication
    process.stdin.setEncoding('utf8');
    
    let buffer = '';
    
    process.stdin.on('data', (chunk) => {
      buffer += chunk;
      
      // Process complete JSON-RPC messages
      let newlineIndex;
      while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
        const message = buffer.substring(0, newlineIndex).trim();
        buffer = buffer.substring(newlineIndex + 1);
        
        if (message) {
          this.processMessage(message);
        }
      }
    });
    
    process.stdin.on('end', () => {
      console.log('Stdin ended, shutting down...');
      this.shutdown();
    });
    
    process.stdin.on('error', (error) => {
      console.error('Stdin error:', error);
      this.shutdown();
    });

    // Handle stdout errors
    process.stdout.on('error', (error) => {
      console.error('Stdout error:', error);
      this.shutdown();
    });

    // Handle process uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.shutdown();
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled promise rejection:', reason);
      this.shutdown();
      process.exit(1);
    });
  }

  shutdown() {
    if (!this.isRunning) {
      console.log('MCP Server is not running');
      return;
    }

    console.log('MCP Server shutting down gracefully...');
    
    this.isRunning = false;
    
    try {
      // Clear any pending operations
      this.tools.clear();
      
      // Close stdin/stdout streams
      if (process.stdin && !process.stdin.destroyed) {
        process.stdin.destroy();
      }
      
      if (process.stdout && !process.stdout.destroyed) {
        process.stdout.end();
      }
      
      console.log('MCP Server shutdown complete');
    } catch (error) {
      console.error('Error during shutdown:', error);
    }
  }
}

module.exports = MCPServer; 