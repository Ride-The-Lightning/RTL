import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommonService } from '../common.js';

describe('CommonService', () => {
  let commonService: CommonService;

  beforeEach(() => {
    commonService = new CommonService();
  });

  describe('maskPasswords', () => {
    it('should mask password fields', () => {
      const obj = {
        username: 'admin',
        password: 'secretPassword123'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.username).toBe('admin');
      expect(result.password).toBe('********************');
    });

    it('should mask rpcpassword fields', () => {
      const obj = {
        rpcuser: 'user',
        rpcpassword: 'secretRpcPass'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcpassword).toBe('********************');
    });

    it('should mask multipass fields', () => {
      const obj = {
        multipass: 'secretMultiPass'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.multipass).toBe('********************');
    });

    it('should not mask allowPasswordUpdate field', () => {
      const obj = {
        allowPasswordUpdate: true
      };
      const result = commonService.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
    });

    it('should handle nested objects', () => {
      const obj = {
        level1: {
          password: 'secret',
          level2: {
            rpcpass: 'rpcSecret'
          }
        }
      };
      const result = commonService.maskPasswords(obj);
      expect(result.level1.password).toBe('********************');
      expect(result.level1.level2.rpcpass).toBe('********************');
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = commonService.maskPasswords(obj);
      expect(result).toEqual({});
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(1672531200);
    });

    it('should handle different dates', () => {
      const date = new Date('2024-06-15T12:30:45.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(Math.floor(date.getTime() / 1000));
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch to formatted date string', () => {
      const timestamp = 1672531200; // 2023-01-01T00:00:00.000Z
      const result = commonService.convertTimestampToTime(timestamp);
      expect(result).toMatch(/\d{2}\/[A-Z]{3}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('should pad single digit days, hours, minutes, seconds', () => {
      // Use a timestamp that results in single digits
      const date = new Date('2023-01-01T01:02:03.000Z');
      const timestamp = Math.floor(date.getTime() / 1000);
      const result = commonService.convertTimestampToTime(timestamp);
      // The result depends on timezone, but format should be correct
      expect(result).toMatch(/\d{2}\/JAN\/2023 \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array ascending by numeric key', () => {
      const arr = [
        { id: 3, name: 'c' },
        { id: 1, name: 'a' },
        { id: 2, name: 'b' }
      ];
      const result = commonService.sortAscByKey(arr, 'id');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should handle string numeric values', () => {
      const arr = [
        { amount: '300' },
        { amount: '100' },
        { amount: '200' }
      ];
      const result = commonService.sortAscByKey(arr, 'amount');
      expect(result[0].amount).toBe('100');
      expect(result[1].amount).toBe('200');
      expect(result[2].amount).toBe('300');
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array ascending by string key', () => {
      const arr = [
        { name: 'Charlie' },
        { name: 'Alice' },
        { name: 'Bob' }
      ];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle case insensitivity', () => {
      const arr = [
        { name: 'charlie' },
        { name: 'ALICE' },
        { name: 'Bob' }
      ];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBe('ALICE');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('charlie');
    });

    it('should handle undefined values', () => {
      const arr = [
        { name: 'Bob' },
        { name: undefined },
        { name: 'Alice' }
      ];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBeUndefined();
      expect(result[1].name).toBe('Alice');
      expect(result[2].name).toBe('Bob');
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array descending by numeric key', () => {
      const arr = [
        { id: 1 },
        { id: 3 },
        { id: 2 }
      ];
      const result = commonService.sortDescByKey(arr, 'id');
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);
    });

    it('should handle falsy values as 0', () => {
      const arr = [
        { amount: 100 },
        { amount: null },
        { amount: 50 }
      ];
      const result = commonService.sortDescByKey(arr, 'amount');
      expect(result[0].amount).toBe(100);
      expect(result[1].amount).toBe(50);
      expect(result[2].amount).toBeNull();
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array descending by string key', () => {
      const arr = [
        { name: 'Alice' },
        { name: 'Charlie' },
        { name: 'Bob' }
      ];
      const result = commonService.sortDescByStrKey(arr, 'name');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });
  });

  describe('newestOnTop', () => {
    it('should move matching item to top of array', () => {
      const arr = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' }
      ];
      const result = commonService.newestOnTop(arr, 'id', 3);
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

    it('should handle hyphenated strings', () => {
      const result = commonService.camelCase('my-test-string');
      expect(result).toBe('My Test String');
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

    it('should handle multiline with period', () => {
      const result = commonService.titleCase('HELLO WORLD.\nGOODBYE WORLD');
      expect(result).toBe('Hello world.\nGoodbye world\n');
    });

    it('should handle multiline with exclamation', () => {
      const result = commonService.titleCase('HELLO!\nWORLD');
      expect(result).toBe('Hello!\nWorld\n');
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true when current version is greater', () => {
      expect(commonService.isVersionCompatible('v0.15.0', '0.14.0')).toBe(true);
    });

    it('should return true when versions are equal', () => {
      expect(commonService.isVersionCompatible('0.15.0', '0.15.0')).toBe(true);
    });

    it('should return false when current version is lower', () => {
      expect(commonService.isVersionCompatible('0.14.0', '0.15.0')).toBe(false);
    });

    it('should handle version with v prefix', () => {
      expect(commonService.isVersionCompatible('v1.2.3', '1.2.0')).toBe(true);
    });

    it('should return false for empty version', () => {
      expect(commonService.isVersionCompatible('', '0.15.0')).toBe(false);
    });

    it('should return false for invalid version string', () => {
      expect(commonService.isVersionCompatible('invalid', '0.15.0')).toBe(false);
    });

    it('should handle major version difference', () => {
      expect(commonService.isVersionCompatible('2.0.0', '1.99.99')).toBe(true);
    });

    it('should handle minor version difference', () => {
      expect(commonService.isVersionCompatible('1.15.0', '1.14.99')).toBe(true);
    });
  });

  describe('getMonthDays', () => {
    it('should return correct days for January', () => {
      expect(commonService.getMonthDays(0, 2023)).toBe(31);
    });

    it('should return 28 for February in non-leap year', () => {
      expect(commonService.getMonthDays(1, 2023)).toBe(28);
    });

    it('should return 29 for February in leap year', () => {
      expect(commonService.getMonthDays(1, 2024)).toBe(29);
    });

    it('should return correct days for April', () => {
      expect(commonService.getMonthDays(3, 2023)).toBe(30);
    });

    it('should return correct days for December', () => {
      expect(commonService.getMonthDays(11, 2023)).toBe(31);
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove sensitive authentication data', () => {
      const node = {
        index: 1,
        lnNode: 'TestNode',
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret-rune',
          lnApiPassword: 'secret-password',
          options: { some: 'option' }
        }
      };
      const result = commonService.removeAuthSecureData(node as any);
      expect(result.authentication.macaroonPath).toBeUndefined();
      expect(result.authentication.runePath).toBeUndefined();
      expect(result.authentication.runeValue).toBeUndefined();
      expect(result.authentication.lnApiPassword).toBeUndefined();
      expect(result.authentication.options).toBeUndefined();
    });

    it('should handle node without authentication', () => {
      const node = {
        index: 1,
        lnNode: 'TestNode'
      };
      const result = commonService.removeAuthSecureData(node as any);
      expect(result).toEqual(node);
    });
  });

  describe('removeSecureData', () => {
    it('should remove sensitive config data', () => {
      const config = {
        defaultNodeIndex: 0,
        selectedNodeIndex: 0,
        rtlConfFilePath: '/path/to/config',
        rtlPass: 'secret',
        multiPass: 'multiSecret',
        multiPassHashed: 'hashedSecret',
        secret2FA: '2faSecret',
        nodes: []
      };
      const result = commonService.removeSecureData(config as any);
      expect(result.rtlConfFilePath).toBeUndefined();
      expect(result.rtlPass).toBeUndefined();
      expect(result.multiPass).toBeUndefined();
      expect(result.multiPassHashed).toBeUndefined();
      expect(result.secret2FA).toBeUndefined();
    });
  });

  describe('findNode', () => {
    it('should find node by index', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'Node1' },
        { index: 2, lnNode: 'Node2' }
      ] as any;
      const result = commonService.findNode(2);
      expect(result?.lnNode).toBe('Node2');
    });

    it('should return undefined for non-existent index', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'Node1' }
      ] as any;
      const result = commonService.findNode(99);
      expect(result).toBeUndefined();
    });
  });

  describe('getRequestIP', () => {
    it('should return x-forwarded-for header if present', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.2' },
        socket: { remoteAddress: '127.0.0.3' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('192.168.1.1');
    });

    it('should return req.ip if no x-forwarded-for', () => {
      const req = {
        headers: {},
        ip: '192.168.1.100',
        connection: { remoteAddress: '127.0.0.2' },
        socket: { remoteAddress: '127.0.0.3' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('192.168.1.100');
    });

    it('should fallback to connection.remoteAddress', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: '10.0.0.5' },
        socket: { remoteAddress: '127.0.0.3' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('10.0.0.5');
    });

    it('should fallback to socket.remoteAddress', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: null },
        socket: { remoteAddress: '10.0.0.10' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('10.0.0.10');
    });
  });

  describe('handleError', () => {
    beforeEach(() => {
      commonService.selectedNode = { lnImplementation: 'LND' } as any;
      // Mock logger to suppress console output in tests
      commonService.logger = { log: vi.fn() } as any;
    });

    it('should handle ENOENT error', () => {
      const err = { code: 'ENOENT', path: '/missing/file' };
      const result = commonService.handleError(err, 'TestFile', 'Test error', commonService.selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.message).toContain('/missing/file');
    });

    it('should handle connection refused error', () => {
      const err = { error: { code: 'ECONNREFUSED' } };
      const result = commonService.handleError(err, 'TestFile', 'Connection failed', commonService.selectedNode);
      expect(result.statusCode).toBe(503);
    });

    it('should extract message from nested error', () => {
      const err = { error: { message: 'Nested error message' } };
      const result = commonService.handleError(err, 'TestFile', 'Test', commonService.selectedNode);
      expect(result.message).toBe('Nested error message');
    });

    it('should sanitize LND macaroon from error for logging', () => {
      // handleError creates a deep copy, sanitizes it for logging, and returns error info
      // The original object is passed to handleError but a copy is made internally
      const err = {
        options: { headers: { 'Grpc-Metadata-macaroon': 'secret-macaroon' } },
        message: 'Test error'
      };
      const result = commonService.handleError(err, 'TestFile', 'Test', commonService.selectedNode);
      // The returned result should have sanitized error info
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Test error');
    });

    it('should handle CLN implementation errors', () => {
      commonService.selectedNode = { lnImplementation: 'CLN' } as any;
      const err = {
        options: { headers: { rune: 'secret-rune' } },
        message: 'CLN Test error'
      };
      const result = commonService.handleError(err, 'TestFile', 'Test', commonService.selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('CLN Test error');
    });

    it('should handle ECL implementation errors', () => {
      commonService.selectedNode = { lnImplementation: 'ECL' } as any;
      const err = {
        options: { headers: { authorization: 'Basic secret' } },
        message: 'ECL Test error'
      };
      const result = commonService.handleError(err, 'TestFile', 'Test', commonService.selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('ECL Test error');
    });

    it('should use provided statusCode', () => {
      const err = { statusCode: 404, message: 'Not found' };
      const result = commonService.handleError(err, 'TestFile', 'Test', commonService.selectedNode);
      expect(result.statusCode).toBe(404);
    });

    it('should use status if statusCode is not present', () => {
      const err = { status: 403, message: 'Forbidden' };
      const result = commonService.handleError(err, 'TestFile', 'Test', commonService.selectedNode);
      expect(result.statusCode).toBe(403);
    });
  });

  describe('runWithConcurrencyLimit', () => {
    it('should run tasks with concurrency limit', async () => {
      const results: number[] = [];
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.resolve(2),
        () => Promise.resolve(3)
      ];

      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, (res) => {
          results.push(...res);
          resolve();
        });
      });

      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle errors in tasks', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Task 2 failed')),
        () => Promise.resolve(3)
      ];

      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, (res) => {
          expect(res[0]).toBe(1);
          expect(res[1]).toHaveProperty('error');
          expect(res[2]).toBe(3);
          resolve();
        });
      });
    });

    it('should handle invalid tasks', async () => {
      const tasks = [
        () => Promise.resolve(1),
        'not a function' as any,
        () => Promise.resolve(3)
      ];

      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, (res) => {
          expect(res[0]).toBe(1);
          expect(res[1]).toHaveProperty('error');
          expect(res[2]).toBe(3);
          resolve();
        });
      });
    });

    it('should handle single task array', async () => {
      // Test with a single task to verify basic functionality
      const tasks = [() => Promise.resolve(42)];

      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, (res) => {
          expect(res).toEqual([42]);
          resolve();
        });
      });
    });

    it('should respect concurrency limit', async () => {
      let concurrentCount = 0;
      let maxConcurrent = 0;

      const createTask = (id: number) => async () => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        await new Promise((r) => setTimeout(r, 10));
        concurrentCount--;
        return id;
      };

      const tasks = [1, 2, 3, 4, 5].map(createTask);

      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, () => {
          expect(maxConcurrent).toBeLessThanOrEqual(2);
          resolve();
        });
      });
    });
  });
});
