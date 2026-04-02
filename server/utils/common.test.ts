import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CommonService } from './common.js';

vi.mock('./logger.js', () => ({
  Logger: {
    log: vi.fn()
  },
  LoggerService: vi.fn()
}));

describe('CommonService', () => {
  let common: CommonService;

  beforeEach(() => {
    common = new CommonService();
  });

  describe('maskPasswords', () => {
    it('should mask password fields', () => {
      const obj = { password: 'secret123', name: 'test' };
      const result = common.maskPasswords(obj);
      expect(result.password).toBe('********************');
      expect(result.name).toBe('test');
    });

    it('should mask multipass fields', () => {
      const obj = { multipass: 'secret', other: 'value' };
      const result = common.maskPasswords(obj);
      expect(result.multipass).toBe('********************');
      expect(result.other).toBe('value');
    });

    it('should mask rpcpass fields', () => {
      const obj = { rpcpass: 'secret', rpcpassword: 'secret2' };
      const result = common.maskPasswords(obj);
      expect(result.rpcpass).toBe('********************');
      expect(result.rpcpassword).toBe('********************');
    });

    it('should mask rpcuser fields', () => {
      const obj = { rpcuser: 'admin' };
      const result = common.maskPasswords(obj);
      expect(result.rpcuser).toBe('********************');
    });

    it('should not mask allowPasswordUpdate field', () => {
      const obj = { allowPasswordUpdate: true, password: 'secret' };
      const result = common.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
      expect(result.password).toBe('********************');
    });

    it('should recursively mask nested objects', () => {
      const obj = { 
        nested: { password: 'nested_secret' }, 
        password: 'top_secret' 
      };
      const result = common.maskPasswords(obj);
      expect(result.nested.password).toBe('********************');
      expect(result.password).toBe('********************');
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = common.maskPasswords(obj);
      expect(result).toEqual({});
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove sensitive authentication fields', () => {
      const node = {
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret_rune',
          lnApiPassword: 'api_password',
          options: { some: 'option' },
          otherField: 'keep_this'
        }
      };
      const result = common.removeAuthSecureData(node as any);
      expect(result.authentication.macaroonPath).toBeUndefined();
      expect(result.authentication.runePath).toBeUndefined();
      expect(result.authentication.runeValue).toBeUndefined();
      expect(result.authentication.lnApiPassword).toBeUndefined();
      expect(result.authentication.options).toBeUndefined();
      expect(result.authentication.otherField).toBe('keep_this');
    });

    it('should handle node without authentication', () => {
      const node = { lnNode: 'TestNode' };
      const result = common.removeAuthSecureData(node as any);
      expect(result.lnNode).toBe('TestNode');
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = common.convertTimeToEpoch(date);
      expect(result).toBe(Math.floor(date.getTime() / 1000));
    });

    it('should handle current date', () => {
      const date = new Date();
      const result = common.convertTimeToEpoch(date);
      expect(result).toBe(Math.floor(date.getTime() / 1000));
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert timestamp to formatted date string', () => {
      const timestamp = 1704067200; // 2024-01-01 00:00:00 UTC
      const result = common.convertTimestampToTime(timestamp);
      expect(result).toMatch(/\d{2}\/[A-Z]{3}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('should pad single digit values with zeros', () => {
      const timestamp = 1704067200;
      const result = common.convertTimestampToTime(timestamp);
      // Check format includes padded values
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array ascending by numeric key', () => {
      const arr = [{ val: 3 }, { val: 1 }, { val: 2 }];
      const result = common.sortAscByKey(arr, 'val');
      expect(result[0].val).toBe(1);
      expect(result[1].val).toBe(2);
      expect(result[2].val).toBe(3);
    });

    it('should handle equal values', () => {
      const arr = [{ val: 2 }, { val: 2 }, { val: 1 }];
      const result = common.sortAscByKey(arr, 'val');
      expect(result[0].val).toBe(1);
      expect(result[1].val).toBe(2);
      expect(result[2].val).toBe(2);
    });

    it('should handle empty array', () => {
      const arr: any[] = [];
      const result = common.sortAscByKey(arr, 'val');
      expect(result).toEqual([]);
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array ascending by string key', () => {
      const arr = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const result = common.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle case insensitive sorting', () => {
      const arr = [{ name: 'bob' }, { name: 'Alice' }, { name: 'CHARLIE' }];
      const result = common.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('bob');
      expect(result[2].name).toBe('CHARLIE');
    });

    it('should handle null/undefined values', () => {
      const arr = [{ name: 'Bob' }, { name: null }, { name: 'Alice' }];
      const result = common.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBe(null);
      expect(result[1].name).toBe('Alice');
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array descending by numeric key', () => {
      const arr = [{ val: 1 }, { val: 3 }, { val: 2 }];
      const result = common.sortDescByKey(arr, 'val');
      expect(result[0].val).toBe(3);
      expect(result[1].val).toBe(2);
      expect(result[2].val).toBe(1);
    });

    it('should handle falsy values', () => {
      const arr = [{ val: 0 }, { val: 3 }, { val: null }];
      const result = common.sortDescByKey(arr, 'val');
      expect(result[0].val).toBe(3);
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array descending by string key', () => {
      const arr = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
      const result = common.sortDescByStrKey(arr, 'name');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });

    it('should handle null/undefined values', () => {
      const arr = [{ name: null }, { name: 'Bob' }, { name: 'Alice' }];
      const result = common.sortDescByStrKey(arr, 'name');
      expect(result[0].name).toBe('Bob');
      expect(result[1].name).toBe('Alice');
    });
  });

  describe('newestOnTop', () => {
    it('should move matching record to top', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = common.newestOnTop(arr, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(1);
      expect(result[2].id).toBe(2);
    });

    it('should handle first element match', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = common.newestOnTop(arr, 'id', 1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case', () => {
      expect(common.camelCase('hello world')).toBe('HelloWorld');
    });

    it('should handle hyphenated strings', () => {
      expect(common.camelCase('hello-world')).toBe('Hello World');
    });

    it('should handle already capitalized strings', () => {
      expect(common.camelCase('Hello World')).toBe('HelloWorld');
    });

    it('should handle null/undefined', () => {
      expect(common.camelCase(null as any)).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert string to title case', () => {
      expect(common.titleCase('hello world')).toBe('Hello World ');
    });

    it('should handle single word', () => {
      expect(common.titleCase('hello')).toBe('Hello');
    });

    it('should handle sentences with newlines', () => {
      const input = 'hello!\nworld';
      const result = common.titleCase(input);
      expect(result).toContain('Hello');
    });

    it('should handle sentences ending with period and newline', () => {
      const input = 'hello.\nworld';
      const result = common.titleCase(input);
      expect(result).toContain('Hello');
    });
  });

  describe('findNode', () => {
    it('should find node by index', () => {
      common.nodes = [
        { index: 1, lnNode: 'Node1' } as any,
        { index: 2, lnNode: 'Node2' } as any
      ];
      const result = common.findNode(2);
      expect(result?.lnNode).toBe('Node2');
    });

    it('should return undefined if node not found', () => {
      common.nodes = [{ index: 1, lnNode: 'Node1' } as any];
      const result = common.findNode(999);
      expect(result).toBeUndefined();
    });
  });

  describe('getMonthDays', () => {
    it('should return correct days for January', () => {
      expect(common.getMonthDays(0, 2024)).toBe(31);
    });

    it('should return 29 days for February in leap year', () => {
      expect(common.getMonthDays(1, 2024)).toBe(29);
    });

    it('should return 28 days for February in non-leap year', () => {
      expect(common.getMonthDays(1, 2023)).toBe(28);
    });

    it('should return correct days for April', () => {
      expect(common.getMonthDays(3, 2024)).toBe(30);
    });

    it('should return correct days for December', () => {
      expect(common.getMonthDays(11, 2024)).toBe(31);
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true when current version is greater', () => {
      expect(common.isVersionCompatible('v1.2.3', '1.2.0')).toBe(true);
    });

    it('should return true when versions are equal', () => {
      expect(common.isVersionCompatible('v1.2.3', '1.2.3')).toBe(true);
    });

    it('should return false when current version is lower', () => {
      expect(common.isVersionCompatible('v1.2.0', '1.2.3')).toBe(false);
    });

    it('should handle version without v prefix', () => {
      expect(common.isVersionCompatible('1.2.3', '1.2.0')).toBe(true);
    });

    it('should return false for invalid version string', () => {
      expect(common.isVersionCompatible('invalid', '1.2.0')).toBe(false);
    });

    it('should return false for empty version', () => {
      expect(common.isVersionCompatible('', '1.2.0')).toBe(false);
    });

    it('should handle major version difference', () => {
      expect(common.isVersionCompatible('v2.0.0', '1.9.9')).toBe(true);
      expect(common.isVersionCompatible('v1.0.0', '2.0.0')).toBe(false);
    });
  });

  describe('getRequestIP', () => {
    it('should return x-forwarded-for header if present', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1'
      };
      expect(common.getRequestIP(req)).toBe('192.168.1.1');
    });

    it('should return req.ip if no x-forwarded-for', () => {
      const req = {
        headers: {},
        ip: '192.168.1.1'
      };
      expect(common.getRequestIP(req)).toBe('192.168.1.1');
    });

    it('should return connection.remoteAddress as fallback', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: '10.0.0.1' },
        socket: { remoteAddress: '10.0.0.2' }
      };
      expect(common.getRequestIP(req)).toBe('10.0.0.1');
    });

    it('should return socket.remoteAddress as fallback', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: null },
        socket: { remoteAddress: '10.0.0.2' }
      };
      expect(common.getRequestIP(req)).toBe('10.0.0.2');
    });
  });

  describe('handleError', () => {
    it('should handle ENOENT error code', () => {
      const errRes = { code: 'ENOENT', path: '/some/path' };
      const selectedNode = { lnImplementation: 'LND', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.error).toContain('/some/path');
    });

    it('should handle error with statusCode', () => {
      const errRes = { statusCode: 404, message: 'Not found' };
      const selectedNode = { lnImplementation: 'LND', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(404);
    });

    it('should handle error with status', () => {
      const errRes = { status: 403, message: 'Forbidden' };
      const selectedNode = { lnImplementation: 'LND', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(403);
    });

    it('should handle ECONNREFUSED error', () => {
      const errRes = { error: { code: 'ECONNREFUSED' } };
      const selectedNode = { lnImplementation: 'LND', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(503);
    });

    it('should extract nested error messages', () => {
      const errRes = { error: { error: { error: 'Deep nested error' } } };
      const selectedNode = { lnImplementation: 'LND', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.error).toBe('Deep nested error');
    });

    it('should handle string error', () => {
      const errRes = 'Simple string error';
      const selectedNode = { lnImplementation: 'LND', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.error).toBe('Simple string error');
    });

    it('should return error object for LND implementation', () => {
      const errRes = {
        statusCode: 500,
        message: 'LND Error',
        options: { headers: { 'Grpc-Metadata-macaroon': 'secret' } }
      };
      const selectedNode = { lnImplementation: 'LND', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('LND Error');
    });

    it('should return error object for CLN implementation', () => {
      const errRes = {
        statusCode: 500,
        message: 'CLN Error',
        options: { headers: { rune: 'secret' } }
      };
      const selectedNode = { lnImplementation: 'CLN', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('CLN Error');
    });

    it('should return error object for ECL implementation', () => {
      const errRes = {
        statusCode: 500,
        message: 'ECL Error',
        options: { headers: { authorization: 'secret' } }
      };
      const selectedNode = { lnImplementation: 'ECL', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('ECL Error');
    });

    it('should handle default case for unknown implementations', () => {
      const errRes = {
        statusCode: 500,
        message: 'Unknown Error',
        options: { headers: { someHeader: 'value' } }
      };
      const selectedNode = { lnImplementation: 'UNKNOWN', settings: {} } as any;
      const result = common.handleError(errRes, 'TestFile', 'Test error', selectedNode);
      expect(result.statusCode).toBe(500);
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
        common.runWithConcurrencyLimit(tasks, 2, resolve);
      });

      expect(results).toEqual([1, 2, 3]);
    });

    it('should handle task errors', async () => {
      const tasks = [
        () => Promise.resolve(1),
        () => Promise.reject(new Error('Task failed')),
        () => Promise.resolve(3)
      ];
      
      const results = await new Promise<any[]>((resolve) => {
        common.runWithConcurrencyLimit(tasks, 2, resolve);
      });

      expect(results[0]).toBe(1);
      expect(results[1]).toHaveProperty('error');
      expect(results[2]).toBe(3);
    });

    it('should respect concurrency limit', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;
      
      const createTask = (value: number) => () => {
        concurrent++;
        maxConcurrent = Math.max(maxConcurrent, concurrent);
        return new Promise((resolve) => {
          setTimeout(() => {
            concurrent--;
            resolve(value);
          }, 10);
        });
      };

      const tasks = [1, 2, 3, 4, 5].map(createTask);
      
      await new Promise<any[]>((resolve) => {
        common.runWithConcurrencyLimit(tasks, 2, resolve);
      });

      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should handle invalid tasks', async () => {
      const tasks = [
        () => Promise.resolve(1),
        'not a function' as any,
        () => Promise.resolve(3)
      ];
      
      const results = await new Promise<any[]>((resolve) => {
        common.runWithConcurrencyLimit(tasks, 2, resolve);
      });

      expect(results[0]).toBe(1);
      expect(results[1]).toHaveProperty('error');
      expect(results[2]).toBe(3);
    });

    it('should handle empty tasks array', () => {
      const tasks: any[] = [];
      let called = false;
      
      common.runWithConcurrencyLimit(tasks, 2, (results) => {
        called = true;
        expect(results).toEqual([]);
      });

      // With empty array, callback is never called since no tasks run
      // The implementation only calls done() when activeCount === 0 AND nextIndex >= tasks.length
      // But runNext is only called in the for loop, which doesn't run with empty tasks
      expect(called).toBe(false);
    });
  });
});
