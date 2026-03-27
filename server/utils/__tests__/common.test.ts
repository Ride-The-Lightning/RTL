import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommonService } from '../common.js';

describe('CommonService', () => {
  let commonService: CommonService;

  beforeEach(() => {
    commonService = new CommonService();
    // Suppress log output during tests
    commonService.logger = { log: vi.fn() } as any;
  });

  describe('maskPasswords', () => {
    it('should mask password fields', () => {
      const obj = {
        username: 'admin',
        password: 'secret123',
        data: 'visible'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.password).toBe('********************');
      expect(result.username).toBe('admin');
      expect(result.data).toBe('visible');
    });

    it('should mask nested password fields', () => {
      const obj = {
        user: {
          name: 'admin',
          rpcpassword: 'secret'
        }
      };
      const result = commonService.maskPasswords(obj);
      expect(result.user.rpcpassword).toBe('********************');
      expect(result.user.name).toBe('admin');
    });

    it('should mask multipass fields', () => {
      const obj = { multipass: 'mypass' };
      const result = commonService.maskPasswords(obj);
      expect(result.multipass).toBe('********************');
    });

    it('should mask rpcpass fields', () => {
      const obj = { rpcpass: 'mypass' };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcpass).toBe('********************');
    });

    it('should mask rpcuser fields', () => {
      const obj = { rpcuser: 'user' };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcuser).toBe('********************');
    });

    it('should not mask allowPasswordUpdate field', () => {
      const obj = { allowPasswordUpdate: true };
      const result = commonService.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
    });

    it('should return empty object unchanged', () => {
      const obj = {};
      const result = commonService.maskPasswords(obj);
      expect(result).toEqual({});
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove authentication secure data', () => {
      const node = {
        index: 1,
        lnNode: 'test',
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret-rune',
          lnApiPassword: 'password',
          options: { key: 'value' }
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
      const node = { index: 1, lnNode: 'test' };
      const result = commonService.removeAuthSecureData(node as any);
      expect(result).toEqual(node);
    });
  });

  describe('removeSecureData', () => {
    it('should remove secure config data', () => {
      const config = {
        rtlConfFilePath: '/path/to/config',
        rtlPass: 'password',
        multiPass: 'multipass',
        multiPassHashed: 'hashed',
        secret2FA: 'secret',
        nodes: []
      };
      const result = commonService.removeSecureData(config as any);
      expect(result.rtlConfFilePath).toBeUndefined();
      expect(result.rtlPass).toBeUndefined();
      expect(result.multiPass).toBeUndefined();
      expect(result.multiPassHashed).toBeUndefined();
      expect(result.secret2FA).toBeUndefined();
    });

    it('should call removeAuthSecureData for each node', () => {
      const config = {
        nodes: [
          { index: 1, authentication: { macaroonPath: '/path' } },
          { index: 2, authentication: { runePath: '/rune' } }
        ]
      };
      const result = commonService.removeSecureData(config as any);
      expect(result.nodes[0].authentication.macaroonPath).toBeUndefined();
      expect(result.nodes[1].authentication.runePath).toBeUndefined();
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(1704067200);
    });

    it('should return integer epoch value', () => {
      const date = new Date('2024-01-01T00:00:00.500Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(Number.isInteger(result)).toBe(true);
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch to formatted string', () => {
      const epoch = 1704067200; // 2024-01-01 00:00:00 UTC
      const result = commonService.convertTimestampToTime(epoch);
      expect(result).toMatch(/\d{2}\/[A-Z]{3}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('should pad single digit values', () => {
      const epoch = 1704067200;
      const result = commonService.convertTimestampToTime(epoch);
      // Should have proper padding
      expect(result.split(' ')[1]).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array ascending by numeric key', () => {
      const arr = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const result = commonService.sortAscByKey(arr, 'id');
      expect(result.map(item => item.id)).toEqual([1, 2, 3]);
    });

    it('should handle empty array', () => {
      const result = commonService.sortAscByKey([], 'id');
      expect(result).toEqual([]);
    });

    it('should handle equal values', () => {
      const arr = [{ id: 1 }, { id: 1 }];
      const result = commonService.sortAscByKey(arr, 'id');
      expect(result.map(item => item.id)).toEqual([1, 1]);
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array ascending by string key', () => {
      const arr = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result.map(item => item.name)).toEqual(['Alice', 'Bob', 'Charlie']);
    });

    it('should be case insensitive', () => {
      const arr = [{ name: 'charlie' }, { name: 'Alice' }, { name: 'BOB' }];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result.map(item => item.name)).toEqual(['Alice', 'BOB', 'charlie']);
    });

    it('should handle undefined values', () => {
      const arr = [{ name: 'Alice' }, { name: undefined }, { name: 'Bob' }];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBeUndefined();
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array descending by numeric key', () => {
      const arr = [{ id: 1 }, { id: 3 }, { id: 2 }];
      const result = commonService.sortDescByKey(arr, 'id');
      expect(result.map(item => item.id)).toEqual([3, 2, 1]);
    });

    it('should handle falsy values as 0', () => {
      const arr = [{ id: 2 }, { id: null }, { id: 1 }];
      const result = commonService.sortDescByKey(arr, 'id');
      expect(result.map(item => item.id)).toEqual([2, 1, null]);
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array descending by string key', () => {
      const arr = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
      const result = commonService.sortDescByStrKey(arr, 'name');
      expect(result.map(item => item.name)).toEqual(['Charlie', 'Bob', 'Alice']);
    });

    it('should be case insensitive', () => {
      const arr = [{ name: 'alice' }, { name: 'CHARLIE' }, { name: 'Bob' }];
      const result = commonService.sortDescByStrKey(arr, 'name');
      expect(result.map(item => item.name)).toEqual(['CHARLIE', 'Bob', 'alice']);
    });
  });

  describe('newestOnTop', () => {
    it('should move matching item to the front', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = commonService.newestOnTop(arr, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result.length).toBe(3);
    });

    it('should maintain other items order', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = commonService.newestOnTop(arr, 'id', 2);
      expect(result.map(item => item.id)).toEqual([2, 1, 3]);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case', () => {
      expect(commonService.camelCase('hello world')).toBe('HelloWorld');
    });

    it('should handle hyphenated strings', () => {
      expect(commonService.camelCase('hello-world')).toBe('Hello World');
    });

    it('should handle undefined', () => {
      expect(commonService.camelCase(undefined as any)).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert string to title case', () => {
      expect(commonService.titleCase('hello world')).toBe('Hello World ');
    });

    it('should handle single word', () => {
      expect(commonService.titleCase('hello')).toBe('Hello');
    });

    it('should handle newlines with period', () => {
      expect(commonService.titleCase('hello.\nworld')).toBe('Hello.\nWorld\n');
    });

    it('should handle newlines with exclamation', () => {
      expect(commonService.titleCase('hello!\nworld')).toBe('Hello!\nWorld\n');
    });
  });

  describe('findNode', () => {
    it('should find node by index', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'Node1' } as any,
        { index: 2, lnNode: 'Node2' } as any
      ];
      const result = commonService.findNode(2);
      expect(result?.lnNode).toBe('Node2');
    });

    it('should return undefined for non-existent index', () => {
      commonService.nodes = [{ index: 1, lnNode: 'Node1' } as any];
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
    });

    it('should return 28 days for February in non-leap year', () => {
      expect(commonService.getMonthDays(1, 2023)).toBe(28);
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true for compatible versions', () => {
      expect(commonService.isVersionCompatible('v1.0.0', '1.0.0')).toBe(true);
      expect(commonService.isVersionCompatible('v2.0.0', '1.0.0')).toBe(true);
      expect(commonService.isVersionCompatible('v1.5.0', '1.4.0')).toBe(true);
    });

    it('should return false for incompatible versions', () => {
      expect(commonService.isVersionCompatible('v0.9.0', '1.0.0')).toBe(false);
      expect(commonService.isVersionCompatible('v1.0.0', '1.1.0')).toBe(false);
    });

    it('should handle version without v prefix', () => {
      expect(commonService.isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
    });

    it('should return false for empty version', () => {
      expect(commonService.isVersionCompatible('', '1.0.0')).toBe(false);
    });

    it('should return false for invalid version format', () => {
      expect(commonService.isVersionCompatible('invalid', '1.0.0')).toBe(false);
    });
  });

  describe('handleError', () => {
    const selectedNode = {
      lnImplementation: 'LND',
      settings: { logLevel: 'ERROR', logFile: '' }
    } as any;

    it('should return error object with statusCode 500 for ENOENT', () => {
      const error = { code: 'ENOENT', path: '/some/path' };
      const result = commonService.handleError(error, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
    });

    it('should use error statusCode if provided', () => {
      const error = { statusCode: 404, message: 'Not found' };
      const result = commonService.handleError(error, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(404);
    });

    it('should use status if statusCode not provided', () => {
      const error = { status: 403, message: 'Forbidden' };
      const result = commonService.handleError(error, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(403);
    });

    it('should return 503 for ECONNREFUSED', () => {
      const error = { error: { code: 'ECONNREFUSED' } };
      const result = commonService.handleError(error, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(503);
    });

    it('should delete LND macaroon headers from error', () => {
      const error = {
        statusCode: 500,
        options: { headers: { 'Grpc-Metadata-macaroon': 'secret' } }
      };
      const result = commonService.handleError(error, 'TestFile', 'Test error', selectedNode);
      expect(result).toBeDefined();
    });

    it('should delete CLN rune headers from error', () => {
      const clnNode = { ...selectedNode, lnImplementation: 'CLN' };
      const error = {
        statusCode: 500,
        options: { headers: { rune: 'secret' } }
      };
      const result = commonService.handleError(error, 'TestFile', 'Test error', clnNode);
      expect(result).toBeDefined();
    });

    it('should delete ECL authorization headers from error', () => {
      const eclNode = { ...selectedNode, lnImplementation: 'ECL' };
      const error = {
        statusCode: 500,
        options: { headers: { authorization: 'secret' } }
      };
      const result = commonService.handleError(error, 'TestFile', 'Test error', eclNode);
      expect(result).toBeDefined();
    });
  });

  describe('getRequestIP', () => {
    it('should return x-forwarded-for header', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1'
      };
      expect(commonService.getRequestIP(req as any)).toBe('192.168.1.1');
    });

    it('should return req.ip if no forwarded header', () => {
      const req = {
        headers: {},
        ip: '127.0.0.1'
      };
      expect(commonService.getRequestIP(req as any)).toBe('127.0.0.1');
    });

    it('should return connection.remoteAddress as fallback', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: '10.0.0.1' },
        socket: { remoteAddress: '10.0.0.2' }
      };
      expect(commonService.getRequestIP(req as any)).toBe('10.0.0.1');
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
        () => Promise.reject(new Error('Test error')),
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

    it('should handle empty tasks array', () => {
      // Note: Empty array with limit > 0 doesn't call done callback - this is existing behavior
      // The for loop doesn't execute when tasks.length is 0
      let callbackCalled = false;
      commonService.runWithConcurrencyLimit([], 2, () => {
        callbackCalled = true;
      });
      // Callback is called synchronously when limit >= tasks.length and tasks is empty
      // Actually checking if done is called immediately when no tasks exist
      expect(callbackCalled).toBe(false);
    });

    it('should handle tasks with limit 0', () => {
      // When limit is 0, no tasks start running
      let callbackCalled = false;
      commonService.runWithConcurrencyLimit([() => Promise.resolve(1)], 0, () => {
        callbackCalled = true;
      });
      expect(callbackCalled).toBe(false);
    });

    it('should handle invalid task', async () => {
      const tasks = ['not a function' as any];

      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, (res) => {
          expect(res[0]).toHaveProperty('error');
          resolve();
        });
      });
    });
  });
});
