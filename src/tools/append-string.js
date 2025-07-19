// Append String Tool
// This tool reads create-prd.md and appends a string to it

const { 
  readCreatePrdFile, 
  createPrdFileExists, 
  getCreatePrdFileInfo,
  checkFilePermissions 
} = require('../utils/file-reader');

/**
 * Validate string input for the append operation
 * @param {any} input - The input to validate
 * @returns {Object} - Validation result with cleaned string or error
 */
function validateStringInput(input) {
  // Check for null/undefined
  if (input === undefined || input === null) {
    return {
      valid: false,
      error: 'String to append is required'
    };
  }
  
  // Check type
  if (typeof input !== 'string') {
    return {
      valid: false,
      error: `String to append must be a string type, got ${typeof input}`
    };
  }
  
  // Trim whitespace
  const trimmedString = input.trim();
  
  // Check for empty string
  if (trimmedString.length === 0) {
    return {
      valid: false,
      error: 'String to append cannot be empty or contain only whitespace'
    };
  }
  
  // Check length limit
  if (trimmedString.length > 10000) {
    return {
      valid: false,
      error: `String to append is too long (${trimmedString.length} characters, maximum 10,000)`
    };
  }
  
  // Check for potentially harmful content (basic sanitization)
  const harmfulPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
    /javascript:/gi, // JavaScript protocol
    /data:text\/html/gi, // Data URLs with HTML
    /vbscript:/gi, // VBScript protocol
  ];
  
  for (const pattern of harmfulPatterns) {
    if (pattern.test(trimmedString)) {
      return {
        valid: false,
        error: 'String to append contains potentially harmful content'
      };
    }
  }
  
  return {
    valid: true,
    cleanedString: trimmedString,
    originalLength: input.length,
    cleanedLength: trimmedString.length
  };
}

/**
 * Format response for MCP protocol
 * @param {string} content - The content to format
 * @param {Object} metadata - Additional metadata about the operation
 * @returns {Object} - Formatted MCP response
 */
function formatMCPResponse(content, metadata = {}) {
  return {
    content: content,
    metadata: {
      operation: 'append-string',
      timestamp: new Date().toISOString(),
      contentLength: content.length,
      ...metadata
    }
  };
}

/**
 * Format error response for MCP protocol
 * @param {string} error - The error message
 * @param {string} code - Error code
 * @param {Object} details - Additional error details
 * @returns {Object} - Formatted MCP error response
 */
function formatMCPError(error, code = 'APPEND_ERROR', details = {}) {
  return {
    error: {
      message: error,
      code: code,
      details: {
        operation: 'append-string',
        timestamp: new Date().toISOString(),
        ...details
      }
    }
  };
}

/**
 * Append a string to the content of create-prd.md
 * @param {string} stringToAppend - The string to append to the file content
 * @returns {Promise<Object>} - MCP formatted response with content and metadata
 * @throws {Error} - If file cannot be read or string is invalid
 */
async function appendString(stringToAppend) {
  try {
    // Validate input using the validation function
    const validation = validateStringInput(stringToAppend);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    
    const trimmedString = validation.cleanedString;
    console.log(`Input validation passed: ${validation.originalLength} -> ${validation.cleanedLength} characters`);
    
    // Check file existence and permissions before reading
    console.log('Checking create-prd.md file availability...');
    const fileExists = await createPrdFileExists();
    if (!fileExists) {
      const fileInfo = await getCreatePrdFileInfo();
      throw new Error(`create-prd.md file is not accessible: ${fileInfo.error || 'File not found'}`);
    }
    
    // Get file information for logging
    const fileInfo = await getCreatePrdFileInfo();
    console.log(`File info: ${fileInfo.size} bytes, readable: ${fileInfo.readable}`);
    
    // Read the create-prd.md file
    const fileContent = await readCreatePrdFile();
    
    // Validate that we got meaningful content
    if (!fileContent || fileContent.trim().length === 0) {
      throw new Error('create-prd.md file is empty or contains only whitespace');
    }
    
    // Combine the content with proper formatting
    const combinedContent = fileContent + '\n\n' + trimmedString;
    
    console.log(`Successfully appended string (${trimmedString.length} characters) to create-prd.md`);
    console.log(`Original file size: ${fileContent.length} characters`);
    console.log(`Total combined content length: ${combinedContent.length} characters`);
    
    // Return formatted MCP response
    return formatMCPResponse(combinedContent, {
      originalFileSize: fileContent.length,
      appendedStringLength: trimmedString.length,
      validationInfo: {
        originalLength: validation.originalLength,
        cleanedLength: validation.cleanedLength
      },
      fileInfo: {
        size: fileInfo.size,
        lastModified: fileInfo.lastModified
      }
    });
  } catch (error) {
    // Return formatted MCP error response
    throw formatMCPError(error.message, 'APPEND_ERROR', {
      inputLength: stringToAppend?.length || 0,
      inputType: typeof stringToAppend
    });
  }
}

/**
 * Get information about the append-string tool
 * @returns {Object} - Tool information and constraints
 */
function getToolInfo() {
  return {
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
  };
}

/**
 * Get detailed integration status with file reading utility
 * @returns {Promise<Object>} - Integration status and file information
 */
async function getIntegrationStatus() {
  try {
    const fileExists = await createPrdFileExists();
    const fileInfo = await getCreatePrdFileInfo();
    
    return {
      toolName: 'append-string',
      fileIntegration: {
        sourceFile: 'instructions/create-prd.md',
        exists: fileExists,
        accessible: fileInfo.readable || false,
        fileSize: fileInfo.size || 0,
        lastModified: fileInfo.lastModified,
        error: fileInfo.error || null
      },
      status: fileExists && fileInfo.readable ? 'ready' : 'error',
      message: fileExists && fileInfo.readable 
        ? 'File reading utility integration is working correctly'
        : `Integration issue: ${fileInfo.error || 'Unknown error'}`
    };
  } catch (error) {
    return {
      toolName: 'append-string',
      fileIntegration: {
        sourceFile: 'instructions/create-prd.md',
        exists: false,
        accessible: false,
        error: error.message
      },
      status: 'error',
      message: `Integration error: ${error.message}`
    };
  }
}

module.exports = { 
  appendString, 
  getToolInfo, 
  getIntegrationStatus, 
  validateStringInput,
  formatMCPResponse,
  formatMCPError
}; 