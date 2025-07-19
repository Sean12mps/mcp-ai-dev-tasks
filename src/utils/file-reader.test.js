const fs = require('fs');
const path = require('path');
const { 
  readFile, 
  readCreatePrdFile, 
  getMCPRootDir, 
  resolveFromMCPRoot,
  readFileWithEncoding,
  isValidUTF8,
  createPrdFileExists,
  getCreatePrdFileInfo,
  checkFilePermissions
} = require('./file-reader');

// Mock fs module
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  promises: {
    readFile: jest.fn(),
    access: jest.fn(),
    stat: jest.fn()
  },
  existsSync: jest.fn(),
  statSync: jest.fn(),
  constants: {
    F_OK: 0,
    R_OK: 4,
    W_OK: 2
  }
}));

describe('File Reader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('readFile', () => {
    test('should be defined', () => {
      expect(readFile).toBeDefined();
    });

    test('should be a function', () => {
      expect(typeof readFile).toBe('function');
    });

    test('should read file successfully', async () => {
      const mockContent = 'test content';
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isFile: () => true });
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await readFile('test.txt');
      expect(result).toBe(mockContent);
    });

    test('should throw error for null file path', async () => {
      await expect(readFile(null)).rejects.toThrow('File path must be a non-empty string');
    });

    test('should throw error for undefined file path', async () => {
      await expect(readFile(undefined)).rejects.toThrow('File path must be a non-empty string');
    });

    test('should throw error for non-string file path', async () => {
      await expect(readFile(123)).rejects.toThrow('File path must be a non-empty string');
    });

    test('should throw error for file not found', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(readFile('nonexistent.txt')).rejects.toThrow('File not found');
    });

    test('should throw error for directory path', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isFile: () => false });
      
      await expect(readFile('directory/')).rejects.toThrow('Path is not a file');
    });
  });

  describe('readCreatePrdFile', () => {
    test('should be defined', () => {
      expect(readCreatePrdFile).toBeDefined();
    });

    test('should be a function', () => {
      expect(typeof readCreatePrdFile).toBe('function');
    });

    test('should read create-prd.md successfully', async () => {
      const mockContent = '# Create PRD\n\nContent here';
      
      // Mock the access check to succeed (file exists and is readable)
      fs.promises.access.mockResolvedValue(undefined);
      
      // Mock the synchronous file system calls used by readFile
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isFile: () => true });
      
      // Mock the readFile call
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await readCreatePrdFile();
      expect(result).toBe(mockContent);
    });

    test('should throw error for empty file content', async () => {
      // Mock the access check to succeed (file exists and is readable)
      fs.promises.access.mockResolvedValue(undefined);
      
      // Mock the synchronous file system calls used by readFile
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({ isFile: () => true });
      
      // Mock the readFile call to return empty content
      fs.promises.readFile.mockResolvedValue('');

      await expect(readCreatePrdFile()).rejects.toThrow('create-prd.md file is empty or contains only whitespace');
    });
  });

  describe('getMCPRootDir', () => {
    test('should be defined', () => {
      expect(getMCPRootDir).toBeDefined();
    });

    test('should return a string', () => {
      const result = getMCPRootDir();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('resolveFromMCPRoot', () => {
    test('should be defined', () => {
      expect(resolveFromMCPRoot).toBeDefined();
    });

    test('should resolve path correctly', () => {
      const result = resolveFromMCPRoot('test/file.txt');
      expect(typeof result).toBe('string');
      expect(result).toContain('test/file.txt');
    });
  });

  describe('readFileWithEncoding', () => {
    test('should be defined', () => {
      expect(readFileWithEncoding).toBeDefined();
    });

    test('should read file with UTF-8 encoding', async () => {
      const mockContent = 'test content';
      fs.promises.readFile.mockResolvedValue(mockContent);

      const result = await readFileWithEncoding('test.txt', 'utf8');
      expect(result).toBe(mockContent);
    });
  });

  describe('isValidUTF8', () => {
    test('should be defined', () => {
      expect(isValidUTF8).toBeDefined();
    });

    test('should validate valid UTF-8 string', () => {
      const result = isValidUTF8('Hello World');
      expect(result).toBe(true);
    });

    test('should validate empty string', () => {
      const result = isValidUTF8('');
      expect(result).toBe(true);
    });
  });

  describe('createPrdFileExists', () => {
    test('should be defined', () => {
      expect(createPrdFileExists).toBeDefined();
    });

    test('should return true when file exists and is readable', async () => {
      fs.promises.access.mockResolvedValue(undefined);

      const result = await createPrdFileExists();
      expect(result).toBe(true);
    });

    test('should return false when file does not exist', async () => {
      fs.promises.access.mockRejectedValue(new Error('ENOENT'));

      const result = await createPrdFileExists();
      expect(result).toBe(false);
    });
  });

  describe('getCreatePrdFileInfo', () => {
    test('should be defined', () => {
      expect(getCreatePrdFileInfo).toBeDefined();
    });

    test('should return file info when file exists', async () => {
      // Mock the access checks to succeed
      fs.promises.access.mockResolvedValue(undefined);
      
      const mockStats = {
        size: 1000,
        isFile: () => true,
        isDirectory: () => false,
        mode: 33188,
        mtime: new Date()
      };
      fs.promises.stat.mockResolvedValue(mockStats);

      const result = await getCreatePrdFileInfo();
      expect(result.exists).toBe(true);
      expect(result.size).toBe(1000);
      expect(result.isFile).toBe(true);
      expect(result.readable).toBe(true);
    });

    test('should return error info when file does not exist', async () => {
      fs.promises.stat.mockRejectedValue({ code: 'ENOENT' });

      const result = await getCreatePrdFileInfo();
      expect(result.exists).toBe(false);
      expect(result.error).toBe('File not found');
    });
  });

  describe('checkFilePermissions', () => {
    test('should be defined', () => {
      expect(checkFilePermissions).toBeDefined();
    });

    test('should return permission info for existing file', async () => {
      fs.promises.access.mockResolvedValue(undefined);
      const mockStats = {
        size: 1000,
        isFile: () => true,
        isDirectory: () => false,
        mode: 33188,
        mtime: new Date()
      };
      fs.promises.stat.mockResolvedValue(mockStats);

      const result = await checkFilePermissions('test.txt');
      expect(result.exists).toBe(true);
      expect(result.readable).toBe(true);
      expect(result.writable).toBe(true);
    });

    test('should return error info for non-existent file', async () => {
      fs.promises.access.mockRejectedValue(new Error('ENOENT'));

      const result = await checkFilePermissions('nonexistent.txt');
      expect(result.exists).toBe(false);
      expect(result.readable).toBe(false);
      expect(result.writable).toBe(false);
    });
  });
}); 