import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { LoggerService, Logger } from './logger.js';
import { LogJSONObj, SelectedNode, Settings } from '../models/config.model.js';

vi.mock('fs', () => ({
  appendFile: vi.fn((path, data, callback) => callback())
}));

describe('LoggerService', () => {
  let logger: LoggerService;
  let consoleSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logger = new LoggerService();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe('ERROR level logging', () => {
    it('should log error message without error object', () => {
      const logObj: LogJSONObj = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error message'
      };

      logger.log(logObj);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('ERROR');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('TestFile');
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Test error message');
    });

    it('should log error with error.message string', () => {
      const logObj: LogJSONObj = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { message: 'Error message string' }
      };

      logger.log(logObj);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error message string');
    });

    it('should log error with error.error.message', () => {
      const logObj: LogJSONObj = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { error: { message: 'Nested error message' } }
      };

      logger.log(logObj);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Nested error message');
    });

    it('should log error with error.stack string', () => {
      const logObj: LogJSONObj = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { stack: 'Error stack trace' }
      };

      logger.log(logObj);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('Error stack trace');
    });

    it('should log error with string error', () => {
      const logObj: LogJSONObj = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: 'String error message'
      };

      logger.log(logObj);

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy.mock.calls[0][0]).toContain('String error message');
    });

    it('should write error to logFile when selectedNode has logFile setting', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'ERROR'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        selectedNode
      };

      logger.log(logObj);

      expect(fs.appendFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('WARN level logging', () => {
    it('should log warn message when no selectedNode', () => {
      const logObj: LogJSONObj = {
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning'
      };

      logger.log(logObj);
      // WARN level does not call console.log or console.error when no selectedNode
      // It just prepares the message but doesn't log to console
      expect(consoleErrorSpy).not.toHaveBeenCalled();
    });

    it('should write to log file when logLevel is WARN', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'WARN'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        selectedNode
      };

      logger.log(logObj);

      expect(fs.appendFile).toHaveBeenCalledTimes(1);
    });

    it('should write to log file when logLevel is INFO', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'INFO'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        selectedNode
      };

      logger.log(logObj);

      expect(fs.appendFile).toHaveBeenCalledTimes(1);
    });

    it('should write to log file when logLevel is DEBUG', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'DEBUG'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        selectedNode
      };

      logger.log(logObj);

      expect(fs.appendFile).toHaveBeenCalledTimes(1);
    });

    it('should include data.message in warn log', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'WARN'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        data: { message: 'Data message' },
        selectedNode
      };

      logger.log(logObj);

      expect(fs.appendFile).toHaveBeenCalledTimes(1);
      const loggedContent = (fs.appendFile as any).mock.calls[0][1];
      expect(loggedContent).toContain('Data message');
    });
  });

  describe('INFO level logging', () => {
    it('should log INFO when fileName is RTL and no selectedNode', () => {
      const logObj: LogJSONObj = {
        level: 'INFO',
        fileName: 'RTL',
        msg: 'RTL info message'
      };

      logger.log(logObj);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][0]).toContain('INFO');
      expect(consoleSpy.mock.calls[0][0]).toContain('RTL');
    });

    it('should log INFO when logLevel is INFO', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'INFO'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message',
        selectedNode
      };

      logger.log(logObj);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(fs.appendFile).toHaveBeenCalledTimes(1);
    });

    it('should log INFO with data when logLevel is DEBUG', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'DEBUG'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message',
        data: 'Some data',
        selectedNode
      };

      logger.log(logObj);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(fs.appendFile).toHaveBeenCalledTimes(1);
      const loggedContent = (fs.appendFile as any).mock.calls[0][1];
      expect(loggedContent).toContain('Some data');
    });
  });

  describe('DEBUG level logging', () => {
    it('should log DEBUG when no selectedNode', () => {
      const logObj: LogJSONObj = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      };

      logger.log(logObj);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][0]).toContain('DEBUG');
    });

    it('should log DEBUG when logLevel is DEBUG', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'DEBUG'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        selectedNode
      };

      logger.log(logObj);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(fs.appendFile).toHaveBeenCalledTimes(1);
    });

    it('should not log DEBUG when logLevel is INFO', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'INFO'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        selectedNode
      };

      logger.log(logObj);

      expect(consoleSpy).not.toHaveBeenCalled();
      expect(fs.appendFile).not.toHaveBeenCalled();
    });

    it('should include data.stack in debug log', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'DEBUG'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: { stack: 'Stack trace info' },
        selectedNode
      };

      logger.log(logObj);

      const loggedContent = (fs.appendFile as any).mock.calls[0][1];
      expect(loggedContent).toContain('Stack trace info');
    });

    it('should stringify object data without message or stack', () => {
      const settings: Settings = {
        blockExplorerUrl: '',
        logFile: '/tmp/test.log',
        logLevel: 'DEBUG'
      };
      const selectedNode: SelectedNode = { settings };
      const logObj: LogJSONObj = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: { key: 'value', num: 123 },
        selectedNode
      };

      logger.log(logObj);

      const loggedContent = (fs.appendFile as any).mock.calls[0][1];
      expect(loggedContent).toContain('key');
      expect(loggedContent).toContain('value');
    });
  });

  describe('default case logging', () => {
    it('should log unknown levels to console', () => {
      const logObj: LogJSONObj = {
        level: 'UNKNOWN',
        fileName: 'TestFile',
        msg: 'Unknown level message'
      };

      logger.log(logObj);

      expect(consoleSpy).toHaveBeenCalledTimes(1);
      expect(consoleSpy.mock.calls[0][0]).toContain('UNKNOWN');
    });
  });

  describe('Logger singleton', () => {
    it('should export a Logger instance', () => {
      expect(Logger).toBeInstanceOf(LoggerService);
    });
  });
});
