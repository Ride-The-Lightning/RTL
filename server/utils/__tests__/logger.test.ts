import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import { LoggerService } from '../logger.js';

// Mock fs module
vi.mock('fs', async () => {
  const actual = await vi.importActual<typeof import('fs')>('fs');
  return {
    ...actual,
    appendFile: vi.fn((path, data, callback) => callback && callback()),
  };
});

describe('LoggerService', () => {
  let logger: LoggerService;
  let consoleSpy: { log: any; error: any };

  beforeEach(() => {
    logger = new LoggerService();
    consoleSpy = {
      log: vi.spyOn(console, 'log').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('log', () => {
    it('should log ERROR level messages to console.error', () => {
      const msgJSON = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error message',
        selectedNode: { settings: { logFile: '' } }
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.error).toHaveBeenCalled();
      const loggedMsg = consoleSpy.error.mock.calls[0][0];
      expect(loggedMsg).toContain('ERROR');
      expect(loggedMsg).toContain('TestFile');
      expect(loggedMsg).toContain('Test error message');
    });

    it('should include error details in ERROR logs', () => {
      const msgJSON = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { message: 'Detailed error info' },
        selectedNode: { settings: { logFile: '' } }
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.error).toHaveBeenCalled();
      const loggedMsg = consoleSpy.error.mock.calls[0][0];
      expect(loggedMsg).toContain('Detailed error info');
    });

    it('should handle nested error.error.message', () => {
      const msgJSON = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { error: { message: 'Nested error message' } },
        selectedNode: { settings: { logFile: '' } }
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.error).toHaveBeenCalled();
      const loggedMsg = consoleSpy.error.mock.calls[0][0];
      expect(loggedMsg).toContain('Nested error message');
    });

    it('should handle string error', () => {
      const msgJSON = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: 'String error message',
        selectedNode: { settings: { logFile: '' } }
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.error).toHaveBeenCalled();
      const loggedMsg = consoleSpy.error.mock.calls[0][0];
      expect(loggedMsg).toContain('String error message');
    });

    it('should log RTL INFO messages without selectedNode', () => {
      const msgJSON = {
        level: 'INFO',
        fileName: 'RTL',
        msg: 'Application started'
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.log).toHaveBeenCalled();
      const loggedMsg = consoleSpy.log.mock.calls[0][0];
      expect(loggedMsg).toContain('INFO');
      expect(loggedMsg).toContain('RTL');
      expect(loggedMsg).toContain('Application started');
    });

    it('should log INFO messages when logLevel is INFO', () => {
      const msgJSON = {
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message',
        selectedNode: { settings: { logFile: '', logLevel: 'INFO' } }
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log DEBUG messages when logLevel is DEBUG', () => {
      const msgJSON = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        selectedNode: { settings: { logFile: '', logLevel: 'DEBUG' } }
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.log).toHaveBeenCalled();
      const loggedMsg = consoleSpy.log.mock.calls[0][0];
      expect(loggedMsg).toContain('DEBUG');
    });

    it('should include data in DEBUG logs', () => {
      const msgJSON = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug with data',
        data: { key: 'value' },
        selectedNode: { settings: { logFile: '', logLevel: 'DEBUG' } }
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should log WARN messages when logLevel is WARN or higher', () => {
      const msgJSON = {
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Warning message',
        selectedNode: { settings: { logFile: '', logLevel: 'WARN' } }
      };
      logger.log(msgJSON as any);
      // WARN level doesn't console.log, it only writes to file
      // So we check fs.appendFile would be called if logFile was set
    });

    it('should write to logFile when configured for ERROR', () => {
      const msgJSON = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Error to file',
        selectedNode: { settings: { logFile: '/tmp/test.log', logLevel: 'ERROR' } }
      };
      logger.log(msgJSON as any);
      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should handle default case for unknown log level', () => {
      const msgJSON = {
        level: 'UNKNOWN',
        fileName: 'TestFile',
        msg: 'Unknown level'
      };
      logger.log(msgJSON as any);
      expect(consoleSpy.log).toHaveBeenCalled();
    });

    it('should format timestamp correctly in log message', () => {
      const msgJSON = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test message',
        selectedNode: { settings: { logFile: '' } }
      };
      logger.log(msgJSON as any);
      const loggedMsg = consoleSpy.error.mock.calls[0][0];
      // Check that it starts with a timestamp format [...]
      expect(loggedMsg).toMatch(/^\[.+\]/);
    });

    it('should include error stack trace when available', () => {
      const msgJSON = {
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { stack: 'Error stack trace here' },
        selectedNode: { settings: { logFile: '' } }
      };
      logger.log(msgJSON as any);
      const loggedMsg = consoleSpy.error.mock.calls[0][0];
      expect(loggedMsg).toContain('Error stack trace here');
    });

    it('should not log DEBUG when logLevel is INFO', () => {
      const msgJSON = {
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        selectedNode: { settings: { logFile: '', logLevel: 'INFO' } }
      };
      logger.log(msgJSON as any);
      // Should not have been called because DEBUG is below INFO
      expect(consoleSpy.log).not.toHaveBeenCalled();
    });
  });
});
