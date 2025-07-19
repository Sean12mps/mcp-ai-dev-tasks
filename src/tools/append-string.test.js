const { 
  appendString, 
  getToolInfo, 
  getIntegrationStatus, 
  validateStringInput, 
  formatMCPResponse, 
  formatMCPError 
} = require('./append-string');

// Mock the file-reader module
jest.mock('../utils/file-reader', () => ({
  readCreatePrdFile: jest.fn(),
  getCreatePrdFileInfo: jest.fn(),
  createPrdFileExists: jest.fn()
}));

const fileReader = require('../utils/file-reader');

describe('Append String Tool', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('appendString', () => {
    test('should be defined', () => {
      expect(appendString).toBeDefined();
    });

    test('should be a function', () => {
      expect(typeof appendString).toBe('function');
    });

    test('should append string successfully', async () => {
      const originalContent = '# Create PRD\n\nOriginal content';
      const stringToAppend = '\n\n## New Section\n\nNew content here';
      const expectedContent = originalContent + '\n\n' + stringToAppend.trim();

      fileReader.createPrdFileExists.mockResolvedValue(true);
      fileReader.getCreatePrdFileInfo.mockResolvedValue({
        exists: true,
        readable: true,
        size: 1000,
        lastModified: new Date()
      });
      fileReader.readCreatePrdFile.mockResolvedValue(originalContent);

      const result = await appendString(stringToAppend);

      expect(result.content).toBe(expectedContent);
      expect(result.metadata.operation).toBe('append-string');
      expect(result.metadata.timestamp).toBeDefined();
      expect(result.metadata.originalFileSize).toBe(originalContent.length);
      expect(result.metadata.appendedStringLength).toBe(stringToAppend.trim().length);
    });

    test('should handle empty string to append', async () => {
      const originalContent = '# Create PRD\n\nOriginal content';
      const stringToAppend = '';

      fileReader.createPrdFileExists.mockResolvedValue(true);
      fileReader.getCreatePrdFileInfo.mockResolvedValue({
        exists: true,
        readable: true,
        size: 1000,
        lastModified: new Date()
      });
      fileReader.readCreatePrdFile.mockResolvedValue(originalContent);

      await expect(appendString(stringToAppend)).rejects.toEqual({
        error: {
          message: 'String to append cannot be empty or contain only whitespace',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String),
            inputLength: 0,
            inputType: 'string'
          }
        }
      });
    });

    test('should throw error for null input', async () => {
      await expect(appendString(null)).rejects.toEqual({
        error: {
          message: 'String to append is required',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String),
            inputLength: 0,
            inputType: 'object'
          }
        }
      });
    });

    test('should throw error for undefined input', async () => {
      await expect(appendString(undefined)).rejects.toEqual({
        error: {
          message: 'String to append is required',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String),
            inputLength: 0,
            inputType: 'undefined'
          }
        }
      });
    });

    test('should throw error for non-string input', async () => {
      await expect(appendString(123)).rejects.toEqual({
        error: {
          message: 'String to append must be a string type, got number',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String),
            inputLength: 0,
            inputType: 'number'
          }
        }
      });
    });

    test('should throw error for empty string input', async () => {
      await expect(appendString('')).rejects.toEqual({
        error: {
          message: 'String to append cannot be empty or contain only whitespace',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String),
            inputLength: 0,
            inputType: 'string'
          }
        }
      });
    });

    test('should throw error for whitespace-only input', async () => {
      await expect(appendString('   ')).rejects.toEqual({
        error: {
          message: 'String to append cannot be empty or contain only whitespace',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String),
            inputLength: 3,
            inputType: 'string'
          }
        }
      });
    });

    test('should throw error when file reading fails', async () => {
      fileReader.createPrdFileExists.mockResolvedValue(false);
      fileReader.getCreatePrdFileInfo.mockResolvedValue({
        exists: false,
        error: 'File not found'
      });

      await expect(appendString('test string')).rejects.toEqual({
        error: {
          message: 'create-prd.md file is not accessible: File not found',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String),
            inputLength: 11,
            inputType: 'string'
          }
        }
      });
    });

    test('should handle very long strings', async () => {
      const originalContent = '# Create PRD\n\nOriginal content';
      const stringToAppend = 'a'.repeat(10000);

      fileReader.createPrdFileExists.mockResolvedValue(true);
      fileReader.getCreatePrdFileInfo.mockResolvedValue({
        exists: true,
        readable: true,
        size: 1000,
        lastModified: new Date()
      });
      fileReader.readCreatePrdFile.mockResolvedValue(originalContent);

      const result = await appendString(stringToAppend);

      expect(result.content).toBe(originalContent + '\n\n' + stringToAppend);
      expect(result.metadata.appendedStringLength).toBe(10000);
    });
  });

  describe('getToolInfo', () => {
    test('should be defined', () => {
      expect(getToolInfo).toBeDefined();
    });

    test('should return tool information', () => {
      const toolInfo = getToolInfo();

      expect(toolInfo).toEqual({
        name: 'append-string',
        description: 'Reads create-prd.md and appends a string to it',
        maxStringLength: 10000,
        supportedFormats: ['string'],
        inputValidation: {
          required: true,
          type: 'string',
          minLength: 1,
          maxLength: 10000,
          trimWhitespace: true
        },
        fileIntegration: {
          sourceFile: 'instructions/create-prd.md',
          encoding: 'UTF-8',
          validation: ['existence', 'readability', 'content'],
          outputFormat: 'string concatenation'
        }
      });
    });
  });

  describe('getIntegrationStatus', () => {
    test('should be defined', () => {
      expect(getIntegrationStatus).toBeDefined();
    });

    test('should return integration status', async () => {
      fileReader.createPrdFileExists.mockResolvedValue(true);
      fileReader.getCreatePrdFileInfo.mockResolvedValue({
        exists: true,
        readable: true,
        size: 1000,
        lastModified: new Date()
      });

      const status = await getIntegrationStatus();

      expect(status).toEqual({
        toolName: 'append-string',
        fileIntegration: {
          sourceFile: 'instructions/create-prd.md',
          exists: true,
          accessible: true,
          fileSize: 1000,
          lastModified: expect.any(Date),
          error: null
        },
        status: 'ready',
        message: 'File reading utility integration is working correctly'
      });
    });

    test('should handle missing file', async () => {
      fileReader.createPrdFileExists.mockResolvedValue(false);
      fileReader.getCreatePrdFileInfo.mockResolvedValue({
        exists: false,
        readable: false,
        error: 'File not found'
      });

      const status = await getIntegrationStatus();

      expect(status).toEqual({
        toolName: 'append-string',
        fileIntegration: {
          sourceFile: 'instructions/create-prd.md',
          exists: false,
          accessible: false,
          fileSize: 0,
          lastModified: undefined,
          error: 'File not found'
        },
        status: 'error',
        message: 'Integration issue: File not found'
      });
    });
  });

  describe('validateStringInput', () => {
    test('should be defined', () => {
      expect(validateStringInput).toBeDefined();
    });

    test('should validate valid string input', () => {
      const result = validateStringInput('valid string');
      expect(result.valid).toBe(true);
      expect(result.cleanedString).toBe('valid string');
    });

    test('should reject null input', () => {
      const result = validateStringInput(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('String to append is required');
    });

    test('should reject undefined input', () => {
      const result = validateStringInput(undefined);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('String to append is required');
    });

    test('should reject non-string input', () => {
      const result = validateStringInput(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('String to append must be a string type, got number');
    });

    test('should reject empty string', () => {
      const result = validateStringInput('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('String to append cannot be empty or contain only whitespace');
    });

    test('should reject whitespace-only string', () => {
      const result = validateStringInput('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('String to append cannot be empty or contain only whitespace');
    });

    test('should sanitize string with leading/trailing whitespace', () => {
      const result = validateStringInput('  test string  ');
      expect(result.valid).toBe(true);
      expect(result.cleanedString).toBe('test string');
    });
  });

  describe('formatMCPResponse', () => {
    test('should be defined', () => {
      expect(formatMCPResponse).toBeDefined();
    });

    test('should format successful response', () => {
      const content = 'test content';
      const metadata = { test: 'data' };

      const result = formatMCPResponse(content, metadata);

      expect(result).toEqual({
        content,
        metadata: {
          operation: 'append-string',
          timestamp: expect.any(String),
          contentLength: 12,
          test: 'data'
        }
      });
    });

    test('should format response without metadata', () => {
      const content = 'test content';

      const result = formatMCPResponse(content);

      expect(result).toEqual({
        content,
        metadata: {
          operation: 'append-string',
          timestamp: expect.any(String),
          contentLength: 12
        }
      });
    });
  });

  describe('formatMCPError', () => {
    test('should be defined', () => {
      expect(formatMCPError).toBeDefined();
    });

    test('should format error response', () => {
      const error = 'Test error';
      const code = 'test context';

      const result = formatMCPError(error, code);

      expect(result).toEqual({
        error: {
          message: 'Test error',
          code: 'test context',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String)
          }
        }
      });
    });

    test('should format error without context', () => {
      const error = 'Test error';

      const result = formatMCPError(error);

      expect(result).toEqual({
        error: {
          message: 'Test error',
          code: 'APPEND_ERROR',
          details: {
            operation: 'append-string',
            timestamp: expect.any(String)
          }
        }
      });
    });
  });
}); 