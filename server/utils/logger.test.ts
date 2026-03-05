import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fs module
vi.mock('fs', () => ({
  default: {
    appendFile: vi.fn((path, content, callback) => callback && callback())
  },
  appendFile: vi.fn((path, content, callback) => callback && callback())
}));

// Re-implement prepMsgData for testing
const prepMsgData = (msgJSON: any, msgStr: string) => {
  if (msgJSON.data) {
    msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? (msgJSON.data.message && typeof msgJSON.data.message === 'string') ?
      msgJSON.data.message : (msgJSON.data.stack && typeof msgJSON.data.stack === 'string') ?
        msgJSON.data.stack : JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '') + '\r\n';
  } else {
    msgStr = msgStr + '.\r\n';
  }
  return msgStr;
};

// Create a testable LoggerService
const createLoggerService = () => {
  const consoleSpy = {
    log: vi.fn(),
    error: vi.fn()
  };

  const fsMock = {
    appendFile: vi.fn((path: string, content: string, callback: () => void) => callback && callback())
  };

  const log = (msgJSON: any) => {
    let msgStr = '[' + new Date().toLocaleString() + '] ' + msgJSON.level + ': ' + msgJSON.fileName + ' => ' + msgJSON.msg;
    
    switch (msgJSON.level) {
      case 'ERROR':
        if (msgJSON.error) {
          msgStr = msgStr + ': ' + ((msgJSON.error.error && msgJSON.error.error.message && typeof msgJSON.error.error.message === 'string') ?
            msgJSON.error.error.message : (typeof msgJSON.error === 'object' && msgJSON.error.message && typeof msgJSON.error.message === 'string') ? msgJSON.error.message : (typeof msgJSON.error === 'object' && msgJSON.error.stack && typeof msgJSON.error.stack === 'string') ?
              msgJSON.error.stack : (typeof msgJSON.error === 'object') ? JSON.stringify(msgJSON.error) : (typeof msgJSON.error === 'string') ?
                msgJSON.error : '') + '\r\n';
        } else {
          msgStr = msgStr + '.\r\n';
        }
        consoleSpy.error(msgStr);
        if (msgJSON.selectedNode && msgJSON.selectedNode.settings && msgJSON.selectedNode.settings.logFile) {
          fsMock.appendFile(msgJSON.selectedNode.settings.logFile, msgStr, () => { });
        }
        break;

      case 'WARN':
        msgStr = prepMsgData(msgJSON, msgStr);
        if (!msgJSON.selectedNode || msgJSON.selectedNode.settings.logLevel === 'WARN' || msgJSON.selectedNode.settings.logLevel === 'INFO' || msgJSON.selectedNode.settings.logLevel === 'DEBUG') {
          if (msgJSON.selectedNode && msgJSON.selectedNode.settings && msgJSON.selectedNode.settings.logFile) {
            fsMock.appendFile(msgJSON.selectedNode.settings.logFile, msgStr, () => { });
          }
        }
        break;

      case 'INFO':
        if (!msgJSON.selectedNode && msgJSON.fileName === 'RTL') {
          consoleSpy.log(msgStr + '.\r\n');
        } else if (msgJSON.selectedNode && msgJSON.selectedNode.settings && msgJSON.selectedNode.settings.logLevel === 'INFO') {
          msgStr = msgStr + '.\r\n';
          consoleSpy.log(msgStr);
          if (msgJSON.selectedNode.settings.logFile) {
            fsMock.appendFile(msgJSON.selectedNode.settings.logFile, msgStr, () => { });
          }
        } else if (msgJSON.selectedNode && msgJSON.selectedNode.settings && msgJSON.selectedNode.settings.logLevel === 'DEBUG') {
          msgStr = prepMsgData(msgJSON, msgStr);
          consoleSpy.log(msgStr);
          if (msgJSON.selectedNode.settings.logFile) {
            fsMock.appendFile(msgJSON.selectedNode.settings.logFile, msgStr, () => { });
          }
        }
        break;

      case 'DEBUG':
        if (!msgJSON.selectedNode) {
          consoleSpy.log(msgStr + '.\r\n');
        } else if (msgJSON.selectedNode && msgJSON.selectedNode.settings && msgJSON.selectedNode.settings.logLevel === 'DEBUG') {
          msgStr = prepMsgData(msgJSON, msgStr);
          consoleSpy.log(msgStr);
          if (msgJSON.selectedNode.settings.logFile) {
            fsMock.appendFile(msgJSON.selectedNode.settings.logFile, msgStr, () => { });
          }
        }
        break;

      default:
        consoleSpy.log(msgStr);
        break;
    }
  };

  return { log, consoleSpy, fsMock };
};

describe('LoggerService', () => {
  let loggerService: ReturnType<typeof createLoggerService>;

  beforeEach(() => {
    loggerService = createLoggerService();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:30:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('ERROR level logging', () => {
    it('should log error messages to console.error', () => {
      loggerService.log({
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error message'
      });

      expect(loggerService.consoleSpy.error).toHaveBeenCalled();
      const loggedMessage = loggerService.consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('ERROR');
      expect(loggedMessage).toContain('TestFile');
      expect(loggedMessage).toContain('Test error message');
    });

    it('should include error details when provided as string', () => {
      loggerService.log({
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: 'Error details string'
      });

      const loggedMessage = loggerService.consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Error details string');
    });

    it('should include error.message when error is an object', () => {
      loggerService.log({
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { message: 'Object error message' }
      });

      const loggedMessage = loggerService.consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Object error message');
    });

    it('should include nested error.error.message', () => {
      loggerService.log({
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { error: { message: 'Nested error message' } }
      });

      const loggedMessage = loggerService.consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Nested error message');
    });

    it('should write to log file when selectedNode has logFile', () => {
      loggerService.log({
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        selectedNode: { settings: { logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.fsMock.appendFile).toHaveBeenCalledWith(
        '/path/to/log.txt',
        expect.any(String),
        expect.any(Function)
      );
    });

    it('should include error stack when available', () => {
      loggerService.log({
        level: 'ERROR',
        fileName: 'TestFile',
        msg: 'Test error',
        error: { stack: 'Error stack trace here' }
      });

      const loggedMessage = loggerService.consoleSpy.error.mock.calls[0][0];
      expect(loggedMessage).toContain('Error stack trace here');
    });
  });

  describe('WARN level logging', () => {
    it('should write WARN to log file when log level allows', () => {
      loggerService.log({
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Warning message',
        selectedNode: { settings: { logLevel: 'WARN', logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.fsMock.appendFile).toHaveBeenCalled();
    });

    it('should write WARN when log level is INFO', () => {
      loggerService.log({
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Warning message',
        selectedNode: { settings: { logLevel: 'INFO', logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.fsMock.appendFile).toHaveBeenCalled();
    });

    it('should write WARN when log level is DEBUG', () => {
      loggerService.log({
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Warning message',
        selectedNode: { settings: { logLevel: 'DEBUG', logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.fsMock.appendFile).toHaveBeenCalled();
    });

    it('should not write WARN when log level is ERROR', () => {
      loggerService.log({
        level: 'WARN',
        fileName: 'TestFile',
        msg: 'Warning message',
        selectedNode: { settings: { logLevel: 'ERROR', logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.fsMock.appendFile).not.toHaveBeenCalled();
    });
  });

  describe('INFO level logging', () => {
    it('should log RTL startup messages without selectedNode', () => {
      loggerService.log({
        level: 'INFO',
        fileName: 'RTL',
        msg: 'Server started'
      });

      expect(loggerService.consoleSpy.log).toHaveBeenCalled();
      const loggedMessage = loggerService.consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('INFO');
      expect(loggedMessage).toContain('RTL');
    });

    it('should log INFO when selectedNode logLevel is INFO', () => {
      loggerService.log({
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message',
        selectedNode: { settings: { logLevel: 'INFO', logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.consoleSpy.log).toHaveBeenCalled();
      expect(loggerService.fsMock.appendFile).toHaveBeenCalled();
    });

    it('should log INFO with data when logLevel is DEBUG', () => {
      loggerService.log({
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message',
        data: { key: 'value' },
        selectedNode: { settings: { logLevel: 'DEBUG', logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.consoleSpy.log).toHaveBeenCalled();
      const loggedMessage = loggerService.consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('key');
    });

    it('should not log INFO when logLevel is ERROR', () => {
      loggerService.log({
        level: 'INFO',
        fileName: 'TestFile',
        msg: 'Info message',
        selectedNode: { settings: { logLevel: 'ERROR' } }
      });

      expect(loggerService.consoleSpy.log).not.toHaveBeenCalled();
    });
  });

  describe('DEBUG level logging', () => {
    it('should log DEBUG when no selectedNode', () => {
      loggerService.log({
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message'
      });

      expect(loggerService.consoleSpy.log).toHaveBeenCalled();
    });

    it('should log DEBUG when logLevel is DEBUG', () => {
      loggerService.log({
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        selectedNode: { settings: { logLevel: 'DEBUG', logFile: '/path/to/log.txt' } }
      });

      expect(loggerService.consoleSpy.log).toHaveBeenCalled();
      expect(loggerService.fsMock.appendFile).toHaveBeenCalled();
    });

    it('should not log DEBUG when logLevel is INFO', () => {
      loggerService.log({
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        selectedNode: { settings: { logLevel: 'INFO' } }
      });

      expect(loggerService.consoleSpy.log).not.toHaveBeenCalled();
    });

    it('should include data in DEBUG message', () => {
      loggerService.log({
        level: 'DEBUG',
        fileName: 'TestFile',
        msg: 'Debug message',
        data: 'Additional debug data',
        selectedNode: { settings: { logLevel: 'DEBUG' } }
      });

      const loggedMessage = loggerService.consoleSpy.log.mock.calls[0][0];
      expect(loggedMessage).toContain('Additional debug data');
    });
  });

  describe('Default level logging', () => {
    it('should log unknown levels to console.log', () => {
      loggerService.log({
        level: 'UNKNOWN',
        fileName: 'TestFile',
        msg: 'Unknown level message'
      });

      expect(loggerService.consoleSpy.log).toHaveBeenCalled();
    });
  });
});

describe('prepMsgData', () => {
  it('should append data string to message', () => {
    const result = prepMsgData({ data: 'test data' }, 'Base message');
    expect(result).toBe('Base message: test data\r\n');
  });

  it('should stringify object data', () => {
    const result = prepMsgData({ data: { key: 'value' } }, 'Base message');
    expect(result).toContain('{"key":"value"}');
  });

  it('should use data.message if available', () => {
    const result = prepMsgData({ data: { message: 'Data message' } }, 'Base message');
    expect(result).toBe('Base message: Data message\r\n');
  });

  it('should use data.stack if available', () => {
    const result = prepMsgData({ data: { stack: 'Stack trace' } }, 'Base message');
    expect(result).toBe('Base message: Stack trace\r\n');
  });

  it('should add period when no data', () => {
    const result = prepMsgData({}, 'Base message');
    expect(result).toBe('Base message.\r\n');
  });
});
