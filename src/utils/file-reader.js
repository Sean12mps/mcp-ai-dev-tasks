// File Reader Utility
// Handles reading files with proper error handling

const fs = require('fs');
const path = require('path');

/**
 * Validate if a string contains valid UTF-8 characters
 * @param {string} str - String to validate
 * @returns {boolean} - True if valid UTF-8, false otherwise
 */
function isValidUTF8(str) {
  try {
    // Try to encode and decode the string to check for invalid characters
    const buffer = Buffer.from(str, 'utf8');
    const decoded = buffer.toString('utf8');
    return decoded === str;
  } catch (error) {
    return false;
  }
}

/**
 * Read a file with UTF-8 encoding and fallback handling
 * @param {string} filePath - Path to the file to read
 * @param {string} encoding - Encoding to use (defaults to 'utf8')
 * @returns {Promise<string>} - File content as string
 * @throws {Error} - If file cannot be read or has encoding issues
 */
async function readFileWithEncoding(filePath, encoding = 'utf8') {
  try {
    const content = await fs.promises.readFile(filePath, encoding);
    
    if (encoding === 'utf8' && !isValidUTF8(content)) {
      throw new Error(`File '${filePath}' contains invalid UTF-8 characters`);
    }
    
    return content;
  } catch (error) {
    if (error.code === 'ENOENCODING') {
      throw new Error(`Unsupported encoding '${encoding}' for file '${filePath}'`);
    }
    throw error;
  }
}

/**
 * Read a file with proper error handling
 * @param {string} filePath - Path to the file to read
 * @returns {Promise<string>} - File content as string
 * @throws {Error} - If file cannot be read
 */
async function readFile(filePath) {
  try {
    // Validate input
    if (!filePath || typeof filePath !== 'string') {
      throw new Error('File path must be a non-empty string');
    }

    // Resolve the file path
    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      throw new Error(`File not found: ${resolvedPath}`);
    }

    // Check if it's a file (not a directory)
    const stats = fs.statSync(resolvedPath);
    if (!stats.isFile()) {
      throw new Error(`Path is not a file: ${resolvedPath}`);
    }

    // Read file with UTF-8 encoding and validation
    const content = await readFileWithEncoding(resolvedPath, 'utf8');
    return content;
  } catch (error) {
    // Re-throw with more context if it's not already our custom error
    if (error.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    } else if (error.code === 'EACCES') {
      // Check if it's a read permission issue
      const permissionInfo = await checkFilePermissions(filePath);
      if (permissionInfo.exists && !permissionInfo.readable) {
        throw new Error(`Permission denied reading file '${filePath}'. File exists but is not readable. Please check file permissions.`);
      } else {
        throw new Error(`Permission denied accessing file '${filePath}'. Please check file permissions.`);
      }
    } else if (error.code === 'EISDIR') {
      throw new Error(`Path is a directory, not a file: ${filePath}`);
    } else if (error.code === 'ENOTDIR') {
      throw new Error(`Path contains a non-directory component: ${filePath}`);
    } else if (!error.message.includes('File path must be') && 
               !error.message.includes('File not found:') && 
               !error.message.includes('Path is not a file:')) {
      throw new Error(`Error reading file '${filePath}': ${error.message}`);
    }
    throw error;
  }
}

/**
 * Get the MCP tool's root directory
 * @returns {string} - Path to the MCP tool root directory
 */
function getMCPRootDir() {
  // Navigate up from src/utils/file-reader.js to the MCP root
  // __filename = src/utils/file-reader.js
  // path.dirname(__filename) = src/utils/
  // path.dirname(path.dirname(__filename)) = src/
  // path.dirname(path.dirname(path.dirname(__filename))) = MCP root
  return path.dirname(path.dirname(path.dirname(__filename)));
}

/**
 * Resolve a path relative to the MCP tool's root directory
 * @param {string} relativePath - Path relative to MCP root
 * @returns {string} - Absolute path
 */
function resolveFromMCPRoot(relativePath) {
  const mcpRoot = getMCPRootDir();
  return path.resolve(mcpRoot, relativePath);
}

/**
 * Check if create-prd.md file exists and is readable
 * @returns {Promise<boolean>} - True if file exists and is readable, false otherwise
 */
async function createPrdFileExists() {
  try {
    const createPrdPath = resolveFromMCPRoot('instructions/create-prd.md');
    return fs.promises.access(createPrdPath, fs.constants.F_OK | fs.constants.R_OK)
      .then(() => true)
      .catch(() => false);
  } catch (error) {
    return false;
  }
}

/**
 * Check file permissions for a given path
 * @param {string} filePath - Path to check permissions for
 * @returns {Promise<Object>} - Permission information
 */
async function checkFilePermissions(filePath) {
  try {
    const resolvedPath = path.resolve(filePath);
    
    // Check if file exists
    const exists = await fs.promises.access(resolvedPath, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);
    
    if (!exists) {
      return {
        path: resolvedPath,
        exists: false,
        readable: false,
        writable: false,
        error: 'File not found'
      };
    }
    
    // Check read permissions
    const readable = await fs.promises.access(resolvedPath, fs.constants.R_OK)
      .then(() => true)
      .catch(() => false);
    
    // Check write permissions
    const writable = await fs.promises.access(resolvedPath, fs.constants.W_OK)
      .then(() => true)
      .catch(() => false);
    
    // Get file stats for additional info
    const stats = await fs.promises.stat(resolvedPath);
    
    return {
      path: resolvedPath,
      exists: true,
      readable,
      writable,
      isFile: stats.isFile(),
      isDirectory: stats.isDirectory(),
      permissions: stats.mode,
      size: stats.size,
      lastModified: stats.mtime
    };
  } catch (error) {
    return {
      path: filePath,
      exists: false,
      readable: false,
      writable: false,
      error: error.message
    };
  }
}

/**
 * Get create-prd.md file information with permission details
 * @returns {Promise<Object>} - File stats and path information
 * @throws {Error} - If file cannot be accessed
 */
async function getCreatePrdFileInfo() {
  try {
    const createPrdPath = resolveFromMCPRoot('instructions/create-prd.md');
    const permissionInfo = await checkFilePermissions(createPrdPath);
    
    if (!permissionInfo.exists) {
      return {
        path: createPrdPath,
        exists: false,
        error: 'File not found'
      };
    }
    
    if (!permissionInfo.readable) {
      return {
        path: createPrdPath,
        exists: true,
        readable: false,
        error: 'Permission denied - file not readable'
      };
    }
    
    return {
      path: createPrdPath,
      exists: true,
      readable: permissionInfo.readable,
      writable: permissionInfo.writable,
      isFile: permissionInfo.isFile,
      isDirectory: permissionInfo.isDirectory,
      permissions: permissionInfo.permissions,
      size: permissionInfo.size,
      lastModified: permissionInfo.lastModified
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      return {
        path: resolveFromMCPRoot('instructions/create-prd.md'),
        exists: false,
        error: 'File not found'
      };
    }
    throw error;
  }
}

/**
 * Read the create-prd.md file specifically with enhanced error handling
 * @returns {Promise<string>} - File content as string
 * @throws {Error} - If file cannot be read
 */
async function readCreatePrdFile() {
  try {
    // Use the path resolution utility
    const createPrdPath = resolveFromMCPRoot('instructions/create-prd.md');
    
    console.log(`Reading create-prd.md from: ${createPrdPath}`);
    
    // Check if file exists first
    const exists = await createPrdFileExists();
    if (!exists) {
      const fileInfo = await getCreatePrdFileInfo();
      throw new Error(`create-prd.md file not found at expected location: ${fileInfo.path}. Please ensure the file exists in the instructions directory.`);
    }
    
    const content = await readFile(createPrdPath);
    
    // Validate that we got some content
    if (!content || content.trim().length === 0) {
      throw new Error('create-prd.md file is empty or contains only whitespace');
    }
    
    console.log(`Successfully read create-prd.md (${content.length} characters)`);
    return content;
  } catch (error) {
    // Provide more specific error messages for common scenarios
    if (error.message.includes('File not found')) {
      throw new Error(`create-prd.md file is missing. Expected location: ${resolveFromMCPRoot('instructions/create-prd.md')}`);
    } else if (error.message.includes('Permission denied')) {
      throw new Error(`Permission denied accessing create-prd.md. Please check file permissions.`);
    } else if (error.message.includes('Path is a directory')) {
      throw new Error(`Expected create-prd.md to be a file, but found a directory instead.`);
    } else {
      throw new Error(`Failed to read create-prd.md: ${error.message}`);
    }
  }
}

module.exports = { 
  readFile, 
  readCreatePrdFile, 
  getMCPRootDir, 
  resolveFromMCPRoot,
  readFileWithEncoding,
  isValidUTF8,
  createPrdFileExists,
  getCreatePrdFileInfo,
  checkFilePermissions
}; 