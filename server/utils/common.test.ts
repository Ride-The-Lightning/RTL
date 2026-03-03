import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommonService } from './common.js';

describe('CommonService', () => {
  let commonService: CommonService;

  beforeEach(() => {
    commonService = new CommonService();
    // Mock the logger to avoid console output during tests
    commonService.logger = {
      log: vi.fn()
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('maskPasswords', () => {
    it('should mask password fields with asterisks', () => {
      const obj = {
        username: 'testuser',
        password: 'secret123',
        data: 'visible'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.username).toBe('testuser');
      expect(result.password).toBe('********************');
      expect(result.data).toBe('visible');
    });

    it('should mask multipass fields', () => {
      const obj = {
        multipass: 'secret123'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.multipass).toBe('********************');
    });

    it('should mask rpcpass fields', () => {
      const obj = {
        rpcpass: 'secret',
        rpcpassword: 'secret2'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcpass).toBe('********************');
      expect(result.rpcpassword).toBe('********************');
    });

    it('should mask rpcuser fields', () => {
      const obj = {
        rpcuser: 'admin'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcuser).toBe('********************');
    });

    it('should NOT mask allowPasswordUpdate field', () => {
      const obj = {
        allowPasswordUpdate: true
      };
      const result = commonService.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
    });

    it('should recursively mask nested objects', () => {
      const obj = {
        outer: {
          password: 'nested-secret'
        }
      };
      const result = commonService.maskPasswords(obj);
      expect(result.outer.password).toBe('********************');
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = commonService.maskPasswords(obj);
      expect(result).toEqual({});
    });

    it('should handle objects with no sensitive fields', () => {
      const obj = {
        name: 'test',
        value: 123
      };
      const result = commonService.maskPasswords(obj);
      expect(result.name).toBe('test');
      expect(result.value).toBe(123);
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove sensitive authentication data', () => {
      const node = {
        index: 1,
        lnNode: 'test-node',
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret-rune',
          lnApiPassword: 'api-pass',
          options: { some: 'options' }
        }
      };
      const result = commonService.removeAuthSecureData(node as any);
      expect(result.authentication.macaroonPath).toBeUndefined();
      expect(result.authentication.runePath).toBeUndefined();
      expect(result.authentication.runeValue).toBeUndefined();
      expect(result.authentication.lnApiPassword).toBeUndefined();
      expect(result.authentication.options).toBeUndefined();
      expect(result.index).toBe(1);
      expect(result.lnNode).toBe('test-node');
    });

    it('should handle node without authentication', () => {
      const node = {
        index: 1,
        lnNode: 'test-node'
      };
      const result = commonService.removeAuthSecureData(node as any);
      expect(result.index).toBe(1);
      expect(result.lnNode).toBe('test-node');
    });
  });

  describe('removeSecureData', () => {
    it('should remove secure config data', () => {
      const config = {
        defaultNodeIndex: 0,
        selectedNodeIndex: 0,
        rtlConfFilePath: '/path/to/config',
        rtlPass: 'secret',
        multiPass: 'multi-secret',
        multiPassHashed: 'hashed',
        secret2FA: '2fa-secret',
        nodes: [
          {
            index: 1,
            authentication: {
              macaroonPath: '/path/to/macaroon'
            }
          }
        ]
      };
      const result = commonService.removeSecureData(config as any);
      expect(result.rtlConfFilePath).toBeUndefined();
      expect(result.rtlPass).toBeUndefined();
      expect(result.multiPass).toBeUndefined();
      expect(result.multiPassHashed).toBeUndefined();
      expect(result.secret2FA).toBeUndefined();
      expect(result.defaultNodeIndex).toBe(0);
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2024-01-15T12:00:00.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(Math.floor(date.getTime() / 1000));
    });

    it('should return integer value', () => {
      const date = new Date('2024-01-15T12:00:00.500Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch timestamp to formatted string', () => {
      // Use a specific timestamp: January 15, 2024 12:30:45
      const timestamp = 1705322445;
      const result = commonService.convertTimestampToTime(timestamp);
      // Result format: DD/MON/YYYY HH:MM:SS
      expect(result).toMatch(/^\d{2}\/[A-Z]{3}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    });

    it('should pad single digit values with zeros', () => {
      // Use a timestamp with single digit values
      const timestamp = 1704067201; // Jan 1, 2024 00:00:01
      const result = commonService.convertTimestampToTime(timestamp);
      expect(result).toContain('01');
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array ascending by numeric key', () => {
      const array = [
        { id: 3, name: 'c' },
        { id: 1, name: 'a' },
        { id: 2, name: 'b' }
      ];
      const result = commonService.sortAscByKey(array, 'id');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should handle empty array', () => {
      const result = commonService.sortAscByKey([], 'id');
      expect(result).toEqual([]);
    });

    it('should handle equal values', () => {
      const array = [
        { id: 1, name: 'a' },
        { id: 1, name: 'b' }
      ];
      const result = commonService.sortAscByKey(array, 'id');
      expect(result.length).toBe(2);
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array ascending by string key', () => {
      const array = [
        { id: 1, name: 'charlie' },
        { id: 2, name: 'alpha' },
        { id: 3, name: 'bravo' }
      ];
      const result = commonService.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe('alpha');
      expect(result[1].name).toBe('bravo');
      expect(result[2].name).toBe('charlie');
    });

    it('should be case insensitive', () => {
      const array = [
        { name: 'Charlie' },
        { name: 'alpha' },
        { name: 'BRAVO' }
      ];
      const result = commonService.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe('alpha');
      expect(result[1].name).toBe('BRAVO');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle undefined values', () => {
      const array = [
        { name: 'alpha' },
        { name: undefined },
        { name: 'bravo' }
      ];
      const result = commonService.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBeUndefined();
      expect(result[1].name).toBe('alpha');
      expect(result[2].name).toBe('bravo');
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array descending by numeric key', () => {
      const array = [
        { id: 1, name: 'a' },
        { id: 3, name: 'c' },
        { id: 2, name: 'b' }
      ];
      const result = commonService.sortDescByKey(array, 'id');
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);
    });

    it('should handle zero and undefined values', () => {
      const array = [
        { id: 0 },
        { id: undefined },
        { id: 5 }
      ];
      const result = commonService.sortDescByKey(array, 'id');
      expect(result[0].id).toBe(5);
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array descending by string key', () => {
      const array = [
        { name: 'alpha' },
        { name: 'charlie' },
        { name: 'bravo' }
      ];
      const result = commonService.sortDescByStrKey(array, 'name');
      expect(result[0].name).toBe('charlie');
      expect(result[1].name).toBe('bravo');
      expect(result[2].name).toBe('alpha');
    });

    it('should handle undefined values', () => {
      const array = [
        { name: 'alpha' },
        { name: undefined }
      ];
      const result = commonService.sortDescByStrKey(array, 'name');
      expect(result[0].name).toBe('alpha');
      expect(result[1].name).toBeUndefined();
    });
  });

  describe('newestOnTop', () => {
    it('should move matching record to top', () => {
      const array = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' }
      ];
      const result = commonService.newestOnTop(array, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(1);
      expect(result[2].id).toBe(2);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case', () => {
      const result = commonService.camelCase('hello world');
      expect(result).toBe('HelloWorld');
    });

    it('should handle hyphens', () => {
      const result = commonService.camelCase('hello-world');
      expect(result).toBe('Hello World');
    });

    it('should handle undefined', () => {
      const result = commonService.camelCase(undefined as any);
      expect(result).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert string to title case', () => {
      const result = commonService.titleCase('hello world');
      expect(result).toBe('Hello World ');
    });

    it('should handle single word', () => {
      const result = commonService.titleCase('hello');
      expect(result).toBe('Hello');
    });

    it('should handle newlines with exclamation', () => {
      const result = commonService.titleCase('HELLO!\nWORLD');
      expect(result).toBe('Hello!\nWorld\n');
    });

    it('should handle newlines with period', () => {
      const result = commonService.titleCase('HELLO.\nWORLD');
      expect(result).toBe('Hello.\nWorld\n');
    });
  });

  describe('findNode', () => {
    it('should find node by index', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'node1' },
        { index: 2, lnNode: 'node2' }
      ] as any;
      const result = commonService.findNode(2);
      expect(result?.lnNode).toBe('node2');
    });

    it('should return undefined for non-existent node', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'node1' }
      ] as any;
      const result = commonService.findNode(99);
      expect(result).toBeUndefined();
    });
  });

  describe('getMonthDays', () => {
    it('should return correct days for regular months', () => {
      expect(commonService.getMonthDays(0, 2024)).toBe(31); // January
      expect(commonService.getMonthDays(3, 2024)).toBe(30); // April
      expect(commonService.getMonthDays(11, 2024)).toBe(31); // December
    });

    it('should return 29 days for February in leap year', () => {
      expect(commonService.getMonthDays(1, 2024)).toBe(29);
      expect(commonService.getMonthDays(1, 2000)).toBe(29);
    });

    it('should return 28 days for February in non-leap year', () => {
      expect(commonService.getMonthDays(1, 2023)).toBe(28);
      expect(commonService.getMonthDays(1, 2025)).toBe(28);
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true for higher major version', () => {
      const result = commonService.isVersionCompatible('v2.0.0', '1.0.0');
      expect(result).toBe(true);
    });

    it('should return true for same version', () => {
      const result = commonService.isVersionCompatible('v1.5.0', '1.5.0');
      expect(result).toBe(true);
    });

    it('should return true for higher minor version', () => {
      const result = commonService.isVersionCompatible('v1.6.0', '1.5.0');
      expect(result).toBe(true);
    });

    it('should return true for higher patch version', () => {
      const result = commonService.isVersionCompatible('v1.5.1', '1.5.0');
      expect(result).toBe(true);
    });

    it('should return false for lower version', () => {
      const result = commonService.isVersionCompatible('v1.4.0', '1.5.0');
      expect(result).toBe(false);
    });

    it('should return false for empty version', () => {
      const result = commonService.isVersionCompatible('', '1.0.0');
      expect(result).toBe(false);
    });

    it('should handle version without v prefix', () => {
      const result = commonService.isVersionCompatible('1.5.0', '1.5.0');
      expect(result).toBe(true);
    });
  });

  describe('handleError', () => {
    it('should handle ENOENT error', () => {
      const errRes = { code: 'ENOENT', path: '/some/path' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as any);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.error).toContain('/some/path');
    });

    it('should handle statusCode from error', () => {
      const errRes = { statusCode: 404, message: 'Not found' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as any);
      expect(result.statusCode).toBe(404);
    });

    it('should handle status from error', () => {
      const errRes = { status: 403, message: 'Forbidden' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as any);
      expect(result.statusCode).toBe(403);
    });

    it('should handle ECONNREFUSED error', () => {
      const errRes = { error: { code: 'ECONNREFUSED' } };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as any);
      expect(result.statusCode).toBe(503);
    });

    it('should return correct error structure for LND with sensitive headers', () => {
      const errRes = {
        options: { headers: { 'Grpc-Metadata-macaroon': 'secret' } },
        statusCode: 500,
        message: 'Test message'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as any);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Test message');
    });

    it('should return correct error structure for CLN with sensitive headers', () => {
      const errRes = {
        options: { headers: { rune: 'secret' } },
        statusCode: 500,
        message: 'Test message'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'CLN' } as any);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Test message');
    });

    it('should return correct error structure for ECL with sensitive headers', () => {
      const errRes = {
        options: { headers: { authorization: 'secret' } },
        statusCode: 500,
        message: 'Test message'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'ECL' } as any);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Test message');
    });

    it('should extract error message from nested error object', () => {
      const errRes = {
        error: { error: { error: 'Deep nested error' } },
        statusCode: 500
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as any);
      expect(result.error).toBe('Deep nested error');
    });
  });

  describe('getRequestIP', () => {
    it('should return x-forwarded-for header', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1'
      };
      const result = commonService.getRequestIP(req);
      expect(result).toBe('192.168.1.1');
    });

    it('should return req.ip if no x-forwarded-for', () => {
      const req = {
        headers: {},
        ip: '127.0.0.1'
      };
      const result = commonService.getRequestIP(req);
      expect(result).toBe('127.0.0.1');
    });

    it('should return connection.remoteAddress', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: '10.0.0.1' }
      };
      const result = commonService.getRequestIP(req);
      expect(result).toBe('10.0.0.1');
    });

    it('should return socket.remoteAddress', () => {
      const req = {
        headers: {},
        ip: null,
        connection: {},
        socket: { remoteAddress: '172.16.0.1' }
      };
      const result = commonService.getRequestIP(req);
      expect(result).toBe('172.16.0.1');
    });
  });

  describe('replaceNode', () => {
    it('should replace node and update session', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'node1' },
        { index: 2, lnNode: 'node2' }
      ] as any;
      const req = {
        session: {
          selectedNode: { index: 2 }
        }
      };
      const newNode = { index: 2, lnNode: 'updated-node2' } as any;
      commonService.replaceNode(req as any, newNode);
      expect(commonService.nodes[1].lnNode).toBe('updated-node2');
      expect(req.session.selectedNode.lnNode).toBe('updated-node2');
    });
  });

  describe('runWithConcurrencyLimit', () => {
    it('should run all tasks and return results', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3)
      ];
      const results = await new Promise<any[]>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, resolve);
      });
      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle errors in tasks', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Task failed')),
        () => Promise.resolve(3)
      ];
      const results = await new Promise<any[]>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, resolve);
      });
      expect(results[0]).toBe(1);
      expect(results[1].error).toBeDefined();
      expect(results[2]).toBe(3);
    });

    it('should handle invalid tasks', async () => {
      const tasks = [
        () => Promise.resolve(1),
        'not a function' as any,
        () => Promise.resolve(3)
      ];
      const results = await new Promise<any[]>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, resolve);
      });
      expect(results[0]).toBe(1);
      expect(results[1].error).toBeDefined();
      expect(results[2]).toBe(3);
    });

    it('should handle empty task array', async () => {
      // Note: The current implementation doesn't handle empty arrays correctly
      // as the callback is never called when tasks.length === 0.
      // This test verifies the current behavior (callback not called for empty array).
      let callbackCalled = false;
      commonService.runWithConcurrencyLimit([], 2, () => {
        callbackCalled = true;
      });
      // Wait a small amount to ensure async operations would have completed
      await new Promise((resolve) => setTimeout(resolve, 10));
      // Current implementation does not call callback for empty arrays
      expect(callbackCalled).toBe(false);
    });

    it('should respect concurrency limit', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;
      const tasks = Array.from({ length: 5 }, () => async () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        await new Promise((resolve) => setTimeout(resolve, 10));
        concurrent--;
        return 'done';
      });
      await new Promise<any[]>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, resolve);
      });
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });
});
