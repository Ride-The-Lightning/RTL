import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LoggerService } from '../logger.js';
import * as fs from 'fs';

// Mock fs module
vi.mock('fs', () => ({
  appendFile: vi.fn((path, data, callback) => callback && callback())
}));

describe('LoggerService', () => {
  let logger: LoggerService;
  let consoleSpy: { log: any; error: any };

  beforeEach(() => {
    logger = new LoggerService();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {})
    };
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ERROR level', () => {
    it('should log error message to console.error', () => {
      logger.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error message'
      });

      expect(consoleSpy.error).toHaveBeenCalled();
      const loggedMessage = consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('ERROR');
      expect(loggedMessage).toContain('TestFile');
      expect(loggedMessage).toContain('Test error message');
    });

    it('should include error details when error object provided', () => {
      logger.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { message: 'Detailed error' }
      });

      const loggedMessage = consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Detailed error');
    });

    it('should handle nested error.error.message', () => {
      logger.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { error: { message: 'Nested error message' } }
      });

      const loggedMessage = consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Nested error message');
    });

    it('should handle error.stack', () => {
      logger.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { stack: 'Error stack trace' }
      });

      const loggedMessage = consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Error stack trace');
    });

    it('should handle string error', () => {
      logger.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: 'String error message'
      });

      const loggedMessage = consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('String error message');
    });

    it('should write to log file when selectedNode has logFile', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'ERROR' }
      } as any;

      logger.log({
        selectedNode,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error'
      });

      expect(fs.appendFile).toHaveBeenCalled();
    });
  });

  describe('WARN level', () => {
    it('should not log when logLevel is not WARN, INFO, or DEBUG', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'ERROR' }
      } as any;

      logger.log({
        selectedNode,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning'
      });

      expect(fs.appendFile).not.toHaveBeenCalled();
    });

    it('should log when logLevel is WARN', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'WARN' }
      } as any;

      logger.log({
        selectedNode,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning'
      });

      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should log when logLevel is INFO', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'INFO' }
      } as any;

      logger.log({
        selectedNode,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning'
      });

      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should log when logLevel is DEBUG', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'DEBUG' }
      } as any;

      logger.log({
        selectedNode,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning'
      });

      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should include data in log message', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'WARN' }
      } as any;

      logger.log({
        selectedNode,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        data: { key: 'value' }
      });

      const appendCall = (fs.appendFile as any).mock.calls[0];
      expect(appendCall[1]).toContain('key');
      expect(appendCall[1]).toContain('value');
    });
  });

  describe('INFO level', () => {
    it('should log to console when no selectedNode and fileName is RTL', () => {
      logger.log({
        selectedNode: null,
        level: 'INFO',
        fileName: 'RTL',
        msg: 'RTL info message'
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      const loggedMessage = consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('RTL');
    });

    it('should log to console and file when logLevel is INFO', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'INFO' }
      } as any;

      logger.log({
        selectedNode,
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Test info'
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should include data when logLevel is DEBUG', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'DEBUG' }
      } as any;

      logger.log({
        selectedNode,
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Test info',
        data: { info: 'details' }
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      const loggedMessage = consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('details');
    });

    it('should not log when logLevel is ERROR', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'ERROR' }
      } as any;

      logger.log({
        selectedNode,
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Test info'
      });

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('DEBUG level', () => {
    it('should log to console when no selectedNode', () => {
      logger.log({
        selectedNode: null,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      });

      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log when logLevel is DEBUG', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'DEBUG' }
      } as any;

      logger.log({
        selectedNode,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      });

      expect(consoleSpy.log).toHaveBeenCalled();
      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should not log when logLevel is INFO', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'INFO' }
      } as any;

      logger.log({
        selectedNode,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      });

      expect(consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should include data message when available', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'DEBUG' }
      } as any;

      logger.log({
        selectedNode,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: { message: 'Data message content' }
      });

      const loggedMessage = consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('Data message content');
    });

    it('should include data stack when available', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'DEBUG' }
      } as any;

      logger.log({
        selectedNode,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: { stack: 'Stack trace info' }
      });

      const loggedMessage = consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('Stack trace info');
    });

    it('should stringify object data', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'DEBUG' }
      } as any;

      logger.log({
        selectedNode,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: { key: 'value', num: 123 }
      });

      const loggedMessage = consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('key');
      expect(loggedMessage).toContain('value');
    });

    it('should handle string data', () => {
      const selectedNode = {
        settings: { logFile: '/path/to/log.txt', logLevel: 'DEBUG' }
      } as any;

      logger.log({
        selectedNode,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: 'Simple string data'
      });

      const loggedMessage = consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('Simple string data');
    });
  });

  describe('default case', () => {
    it('should log unknown levels to console.log', () => {
      logger.log({
        selectedNode: null,
        level: 'CUSTOM' as any,
        fileName: 'TestFile',
        msg: 'Custom level message'
      });

      expect(consoleSpy.log).toHaveBeenCalled();
    });
  });

  describe('log message format', () => {
    it('should include timestamp in log message', () => {
      logger.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test message'
      });

      const loggedMessage = consoleSpy.error.mock.calls[0][0];
      // Check for date format pattern [...]
      expect(loggedMessage).toMatch(/\[.+\]/);
    });

    it('should include file name and message arrow format', () => {
      logger.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test message'
      });

      const loggedMessage = consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('TestFile =>');
    });
  });
});
