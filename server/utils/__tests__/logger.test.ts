import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LoggerService } from '../logger.js';

// Mock fs module
vi.mock('fs', () => ({
  appendFile: vi.fn((path, data, callback) => callback())
}));

describe('LoggerService', () => {
  let loggerService: LoggerService;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    loggerService = new LoggerService();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('ERROR level', () => {
    it('should log error message without error object', () => {
      loggerService.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error message'
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('ERROR');
      expect(loggedMessage).toContain('TestFile');
      expect(loggedMessage).toContain('Test error message');
      expect(loggedMessage).toContain('.\r\n');
    });

    it('should log error message with error string', () => {
      loggerService.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: 'Error string message'
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Error string message');
    });

    it('should log error message with error object containing message', () => {
      loggerService.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { message: 'Error object message' }
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Error object message');
    });

    it('should log error message with nested error object', () => {
      loggerService.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { error: { message: 'Nested error message' } }
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Nested error message');
    });

    it('should log error message with error object containing stack', () => {
      loggerService.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { stack: 'Error stack trace' }
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Error stack trace');
    });

    it('should log error message with plain object error', () => {
      loggerService.log({
        selectedNode: null,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { code: 500, details: 'Some details' }
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      const loggedMessage = consoleErrorSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('code');
      expect(loggedMessage).toContain('500');
    });

    it('should write to log file when selectedNode has logFile setting', async () => {
      const fs = await import('fs');
      
      loggerService.log({
        selectedNode: { settings: { logFile: '/path/to/log.txt' } } as any,
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error message'
      });

      expect(fs.appendFile).toHaveBeenCalledWith(
        '/path/to/log.txt',
        expect.any(String),
        expect.any(Function)
      );
    });
  });

  describe('WARN level', () => {
    it('should log warning with data', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'WARN' } } as any,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        data: 'Warning data'
      });

      // WARN doesn't console.log, only writes to file if configured
    });

    it('should log warning without data', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'WARN' } } as any,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning'
      });
    });

    it('should write to log file when log level allows', async () => {
      const fs = await import('fs');
      
      loggerService.log({
        selectedNode: { settings: { logLevel: 'DEBUG', logFile: '/path/to/log.txt' } } as any,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning'
      });

      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should log warning with object data containing message', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'WARN', logFile: '/path/to/log.txt' } } as any,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        data: { message: 'Warning message from object' }
      });
    });

    it('should log warning with object data containing stack', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'WARN', logFile: '/path/to/log.txt' } } as any,
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Test warning',
        data: { stack: 'Warning stack trace' }
      });
    });
  });

  describe('INFO level', () => {
    it('should log info when no selectedNode and fileName is RTL', () => {
      loggerService.log({
        selectedNode: null,
        level: 'INFO',
        fileName: 'RTL',
        msg: 'RTL startup message'
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('INFO');
      expect(loggedMessage).toContain('RTL');
    });

    it('should log info when selectedNode has INFO log level', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'INFO' } } as any,
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message'
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('INFO');
    });

    it('should log info with data when selectedNode has DEBUG log level', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'DEBUG' } } as any,
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message',
        data: 'Additional info'
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('Additional info');
    });

    it('should write to log file when INFO level and logFile configured', async () => {
      const fs = await import('fs');
      
      loggerService.log({
        selectedNode: { settings: { logLevel: 'INFO', logFile: '/path/to/log.txt' } } as any,
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message'
      });

      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should not log info when selectedNode has different log level', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'ERROR' } } as any,
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message'
      });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('DEBUG level', () => {
    it('should log debug when no selectedNode', () => {
      loggerService.log({
        selectedNode: null,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      });

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug when selectedNode has DEBUG log level', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'DEBUG' } } as any,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: { key: 'value' }
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('DEBUG');
    });

    it('should write to log file when DEBUG level and logFile configured', async () => {
      const fs = await import('fs');
      
      loggerService.log({
        selectedNode: { settings: { logLevel: 'DEBUG', logFile: '/path/to/log.txt' } } as any,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      });

      expect(fs.appendFile).toHaveBeenCalled();
    });

    it('should not log debug when selectedNode has higher log level', () => {
      loggerService.log({
        selectedNode: { settings: { logLevel: 'INFO' } } as any,
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      });

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });

  describe('default level', () => {
    it('should log unknown level to console', () => {
      loggerService.log({
        selectedNode: null,
        level: 'UNKNOWN' as any,
        fileName: 'TestFile',
        msg: 'Unknown level message'
      });

      expect(consoleLogSpy).toHaveBeenCalled();
      const loggedMessage = consoleLogSpy.mock.calls[0][0];
      expect(loggedMessage).toContain('UNKNOWN');
    });
  });
});
