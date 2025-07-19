# AI Dev Tasks MCP Tool

A simple Model Context Protocol (MCP) tool that reads `create-prd.md` and appends strings to it. This tool is designed to work offline and be accessible via npx.

## Features

- **Single Tool**: One focused tool for appending strings to `create-prd.md`
- **Offline Operation**: No external dependencies or network requirements
- **NPX Accessible**: Install and run directly via npx
- **Robust Error Handling**: Comprehensive validation and error reporting
- **MCP Protocol Compliant**: Full JSON-RPC 2.0 implementation
- **File System Integration**: Secure file reading and validation

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn package manager

### Quick Start

```bash
# Install globally via npx (recommended)
npx ai-dev-tasks@latest

# Or install locally
npm install ai-dev-tasks
```

### Development Installation

```bash
# Clone the repository
git clone <repository-url>
cd mcp-ai-dev-tasks

# Install dependencies
npm install

# Run tests
npm test

# Build for production
npm run build
```

## Usage

### As an MCP Tool

This tool is designed to be used as an MCP server that communicates via JSON-RPC 2.0 over stdin/stdout.

#### Tool Discovery

The tool provides one tool: `append-string`

```json
{
  "name": "append-string",
  "description": "Reads create-prd.md and appends a string to it",
  "inputSchema": {
    "type": "object",
    "properties": {
      "stringToAppend": {
        "type": "string",
        "description": "The string to append to the create-prd.md content",
        "minLength": 1,
        "maxLength": 10000
      }
    },
    "required": ["stringToAppend"]
  },
  "metadata": {
    "version": "1.0.0",
    "author": "ai-dev-tasks",
    "category": "file-processing",
    "tags": ["string", "append", "markdown", "file"],
    "capabilities": ["file-reading", "string-processing", "content-combination"]
  }
}
```

#### Tool Execution

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "append-string",
    "arguments": {
      "stringToAppend": "## New Section\n\nThis is new content to append."
    }
  }
}
```

**Success Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": "# Create PRD\n\nOriginal content\n\n## New Section\n\nThis is new content to append.",
    "metadata": {
      "operation": "append-string",
      "timestamp": "2025-07-19T15:00:00.000Z",
      "contentLength": 89,
      "originalFileSize": 30,
      "appendedStringLength": 59,
      "validationInfo": {
        "originalLength": 59,
        "cleanedLength": 59
      },
      "fileInfo": {
        "size": 1000,
        "lastModified": "2025-07-19T14:00:00.000Z"
      }
    }
  }
}
```

**Error Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "message": "String to append cannot be empty or contain only whitespace",
    "code": "APPEND_ERROR",
    "details": {
      "operation": "append-string",
      "timestamp": "2025-07-19T15:00:00.000Z",
      "inputLength": 0,
      "inputType": "string"
    }
  }
}
```

### Direct Usage

You can also use the tool directly in Node.js:

```javascript
const { appendString, getToolInfo, getIntegrationStatus } = require('ai-dev-tasks');

// Append a string to create-prd.md
async function example() {
  try {
    const result = await appendString('## New Feature\n\nDescription of the new feature.');
    console.log('Appended content:', result.content);
    console.log('Metadata:', result.metadata);
  } catch (error) {
    console.error('Error:', error.error.message);
  }
}

// Get tool information
const toolInfo = getToolInfo();
console.log('Tool info:', toolInfo);

// Check integration status
async function checkStatus() {
  const status = await getIntegrationStatus();
  console.log('Integration status:', status);
}
```

## File Structure

```
mcp-ai-dev-tasks/
├── index.js                 # Entry point with shebang
├── package.json            # Package configuration
├── src/
│   ├── mcp-server.js       # MCP server implementation
│   ├── tools/
│   │   └── append-string.js # Main tool implementation
│   └── utils/
│       └── file-reader.js  # File reading utilities
├── tests/
│   ├── integration/        # Integration tests
│   └── unit/              # Unit tests
├── instructions/
│   └── create-prd.md      # Target file for appending
└── README.md              # This file
```

## Configuration

### Required Files

The tool expects a `create-prd.md` file in the `instructions/` directory relative to the MCP tool root.

**File Location:** `instructions/create-prd.md`

**File Requirements:**
- Must exist and be readable
- Must contain non-empty content
- Must be a valid UTF-8 encoded text file
- Should be a markdown file (recommended)

### Environment Variables

No environment variables are required. The tool operates completely offline.

## API Reference

### Core Functions

#### `appendString(stringToAppend)`

Appends a string to the content of `create-prd.md`.

**Parameters:**
- `stringToAppend` (string, required): The string to append

**Returns:** Promise<Object>
- `content` (string): The combined content
- `metadata` (Object): Operation metadata

**Throws:** Object with error details

#### `getToolInfo()`

Returns information about the tool.

**Returns:** Object
- `name` (string): Tool name
- `description` (string): Tool description
- `maxStringLength` (number): Maximum string length
- `supportedFormats` (Array): Supported input formats
- `inputValidation` (Object): Validation rules
- `fileIntegration` (Object): File integration details

#### `getIntegrationStatus()`

Returns the integration status with file reading utility.

**Returns:** Promise<Object>
- `toolName` (string): Tool name
- `fileIntegration` (Object): File integration status
- `status` (string): Overall status
- `message` (string): Status message

### Utility Functions

#### `validateStringInput(input)`

Validates and sanitizes string input.

**Parameters:**
- `input` (any): Input to validate

**Returns:** Object
- `valid` (boolean): Whether input is valid
- `cleanedString` (string): Sanitized string (if valid)
- `error` (string): Error message (if invalid)

#### `formatMCPResponse(content, metadata)`

Formats successful MCP response.

**Parameters:**
- `content` (string): Response content
- `metadata` (Object, optional): Additional metadata

**Returns:** Object with MCP response format

#### `formatMCPError(error, code, details)`

Formats error response for MCP protocol.

**Parameters:**
- `error` (string): Error message
- `code` (string, optional): Error code
- `details` (Object, optional): Additional details

**Returns:** Object with MCP error format

## Error Handling

The tool provides comprehensive error handling with detailed error messages:

### Common Error Types

1. **Input Validation Errors**
   - Null/undefined input
   - Non-string input
   - Empty or whitespace-only strings
   - Strings exceeding maximum length (10,000 characters)
   - Potentially harmful content

2. **File System Errors**
   - File not found
   - Permission denied
   - File is a directory
   - Empty file content
   - Encoding issues

3. **MCP Protocol Errors**
   - Invalid JSON-RPC format
   - Missing required parameters
   - Tool not found
   - Internal server errors

### Error Response Format

All errors follow the MCP error format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "details": {
      "operation": "append-string",
      "timestamp": "ISO-8601 timestamp",
      "inputLength": 0,
      "inputType": "string"
    }
  }
}
```

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm test src/utils/file-reader.test.js
npm test src/tools/append-string.test.js

# Run with coverage
npm run test:coverage

# Run integration tests
npm run test:integration
```

### Test Coverage

The test suite includes:

- **Unit Tests**: Individual function testing with mocking
- **Integration Tests**: End-to-end MCP server testing
- **Error Handling**: Comprehensive error scenario testing
- **Input Validation**: Edge cases and boundary testing
- **File System**: File operation testing with mocks

## Development

### Project Structure

The project follows a modular architecture:

- **MCP Server** (`src/mcp-server.js`): JSON-RPC 2.0 protocol implementation
- **Tools** (`src/tools/`): Individual MCP tool implementations
- **Utilities** (`src/utils/`): Shared utility functions
- **Tests** (`tests/`): Comprehensive test suite

### Adding New Tools

To add a new tool:

1. Create a new file in `src/tools/`
2. Implement the tool functions
3. Register the tool in `src/mcp-server.js`
4. Add comprehensive tests
5. Update documentation

### Code Style

- Follow JavaScript ES6+ standards
- Use async/await for asynchronous operations
- Implement comprehensive error handling
- Add JSDoc comments for all functions
- Follow consistent naming conventions

## Troubleshooting

### Common Issues

1. **"File not found" Error**
   - Ensure `instructions/create-prd.md` exists
   - Check file permissions
   - Verify file path is correct

2. **"Permission denied" Error**
   - Check file read permissions
   - Ensure proper file ownership
   - Verify directory permissions

3. **"Invalid input" Error**
   - Ensure input is a non-empty string
   - Check for whitespace-only strings
   - Verify input length (max 10,000 characters)

4. **MCP Protocol Errors**
   - Verify JSON-RPC 2.0 format
   - Check required parameters
   - Ensure proper tool registration

### Debug Mode

Enable debug logging by setting the environment variable:

```bash
DEBUG=ai-dev-tasks:* npx ai-dev-tasks
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Development Setup

```bash
# Clone and setup
git clone <repository-url>
cd mcp-ai-dev-tasks
npm install

# Run tests
npm test

# Run linting
npm run lint

# Build
npm run build
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:

- Create an issue on GitHub
- Check the troubleshooting section
- Review the test examples
- Consult the API documentation

## Changelog

### Version 1.0.0
- Initial release
- Single append-string tool
- MCP protocol implementation
- Comprehensive error handling
- Full test coverage
- NPX distribution support 