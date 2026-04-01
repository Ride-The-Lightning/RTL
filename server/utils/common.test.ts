import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CommonService } from './common.js';

// Create a fresh instance for each test to avoid state pollution
const createCommonService = () => {
  const service = new CommonService();
  // Mock the logger to avoid console output during tests
  service.logger = {
    log: vi.fn()
  } as any;
  return service;
};

describe('CommonService', () => {
  describe('maskPasswords', () => {
    it('should mask password fields in an object', () => {
      const service = createCommonService();
      const obj = { username: 'admin', password: 'secret123' };
      const result = service.maskPasswords(obj);
      expect(result.username).toBe('admin');
      expect(result.password).toBe('********************');
    });

    it('should mask multipass fields', () => {
      const service = createCommonService();
      const obj = { multiPass: 'mysecretpass' };
      const result = service.maskPasswords(obj);
      expect(result.multiPass).toBe('********************');
    });

    it('should mask rpcpass fields', () => {
      const service = createCommonService();
      const obj = { rpcpass: 'rpcpassword123' };
      const result = service.maskPasswords(obj);
      expect(result.rpcpass).toBe('********************');
    });

    it('should mask rpcpassword fields', () => {
      const service = createCommonService();
      const obj = { rpcpassword: 'myrpcpass' };
      const result = service.maskPasswords(obj);
      expect(result.rpcpassword).toBe('********************');
    });

    it('should mask rpcuser fields', () => {
      const service = createCommonService();
      const obj = { rpcuser: 'myuser' };
      const result = service.maskPasswords(obj);
      expect(result.rpcuser).toBe('********************');
    });

    it('should not mask allowPasswordUpdate field', () => {
      const service = createCommonService();
      const obj = { allowPasswordUpdate: true };
      const result = service.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
    });

    it('should handle nested objects', () => {
      const service = createCommonService();
      const obj = {
        config: {
          password: 'nested-secret'
        }
      };
      const result = service.maskPasswords(obj);
      expect(result.config.password).toBe('********************');
    });

    it('should handle empty objects', () => {
      const service = createCommonService();
      const result = service.maskPasswords({});
      expect(result).toEqual({});
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert a Date to epoch seconds', () => {
      const service = createCommonService();
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = service.convertTimeToEpoch(date);
      expect(result).toBe(1704067200);
    });

    it('should floor milliseconds', () => {
      const service = createCommonService();
      const date = new Date('2024-01-01T00:00:00.999Z');
      const result = service.convertTimeToEpoch(date);
      expect(result).toBe(1704067200);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array ascending by numeric key', () => {
      const service = createCommonService();
      const array = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = service.sortAscByKey(array, 'value');
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(3);
    });

    it('should handle equal values', () => {
      const service = createCommonService();
      const array = [{ value: 1 }, { value: 1 }];
      const result = service.sortAscByKey(array, 'value');
      expect(result.length).toBe(2);
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(1);
    });

    it('should handle empty array', () => {
      const service = createCommonService();
      const result = service.sortAscByKey([], 'value');
      expect(result).toEqual([]);
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array descending by numeric key', () => {
      const service = createCommonService();
      const array = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const result = service.sortDescByKey(array, 'value');
      expect(result[0].value).toBe(3);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(1);
    });

    it('should handle missing keys by treating them as 0', () => {
      const service = createCommonService();
      const array = [{ value: 2 }, { other: 'x' }, { value: 1 }];
      const result = service.sortDescByKey(array, 'value');
      expect(result[0].value).toBe(2);
      expect(result[1].value).toBe(1);
      expect(result[2].other).toBe('x');
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array ascending by string key', () => {
      const service = createCommonService();
      const array = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const result = service.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should be case insensitive', () => {
      const service = createCommonService();
      const array = [{ name: 'bob' }, { name: 'Alice' }, { name: 'BOB' }];
      const result = service.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe('Alice');
    });

    it('should handle missing keys', () => {
      const service = createCommonService();
      const array = [{ name: 'Bob' }, { other: 'x' }, { name: 'Alice' }];
      const result = service.sortAscByStrKey(array, 'name');
      expect(result[0].other).toBe('x');
      expect(result[1].name).toBe('Alice');
      expect(result[2].name).toBe('Bob');
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array descending by string key', () => {
      const service = createCommonService();
      const array = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
      const result = service.sortDescByStrKey(array, 'name');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });
  });

  describe('newestOnTop', () => {
    it('should move matching item to the top', () => {
      const service = createCommonService();
      const array = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = service.newestOnTop(array, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result.length).toBe(3);
    });

    it('should handle item already at top', () => {
      const service = createCommonService();
      const array = [{ id: 1 }, { id: 2 }];
      const result = service.newestOnTop(array, 'id', 1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case', () => {
      const service = createCommonService();
      expect(service.camelCase('hello world')).toBe('HelloWorld');
    });

    it('should handle hyphens', () => {
      const service = createCommonService();
      expect(service.camelCase('hello-world')).toBe('Hello World');
    });

    it('should handle null/undefined', () => {
      const service = createCommonService();
      expect(service.camelCase(null as any)).toBeUndefined();
      expect(service.camelCase(undefined as any)).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert single word to title case', () => {
      const service = createCommonService();
      expect(service.titleCase('hello')).toBe('Hello');
    });

    it('should convert multiple words to title case', () => {
      const service = createCommonService();
      expect(service.titleCase('hello world')).toBe('Hello World ');
    });

    it('should handle sentences with newlines and periods', () => {
      const service = createCommonService();
      const input = 'HELLO WORLD.\nGOODBYE WORLD';
      const result = service.titleCase(input);
      // The function processes each line separately, converting to title case per line
      expect(result).toContain('Hello world.');
      expect(result).toContain('Goodbye world');
    });

    it('should handle sentences with newlines and exclamation marks', () => {
      const service = createCommonService();
      const input = 'HELLO WORLD!\nGOODBYE';
      const result = service.titleCase(input);
      // The function processes each line separately, converting to title case per line
      expect(result).toContain('Hello world!');
      expect(result).toContain('Goodbye');
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true when current version is greater', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible('2.0.0', '1.0.0')).toBe(true);
    });

    it('should return true when versions are equal', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible('1.0.0', '1.0.0')).toBe(true);
    });

    it('should return false when current version is lower', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible('1.0.0', '2.0.0')).toBe(false);
    });

    it('should handle v prefix', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible('v2.0.0', '1.0.0')).toBe(true);
    });

    it('should return false for empty version', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible('', '1.0.0')).toBe(false);
    });

    it('should return false for null version', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible(null as any, '1.0.0')).toBe(false);
    });

    it('should handle minor version comparison', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible('1.2.0', '1.1.0')).toBe(true);
      expect(service.isVersionCompatible('1.1.0', '1.2.0')).toBe(false);
    });

    it('should handle patch version comparison', () => {
      const service = createCommonService();
      expect(service.isVersionCompatible('1.0.2', '1.0.1')).toBe(true);
      expect(service.isVersionCompatible('1.0.1', '1.0.2')).toBe(false);
    });
  });

  describe('getMonthDays', () => {
    it('should return 31 for January', () => {
      const service = createCommonService();
      expect(service.getMonthDays(0, 2024)).toBe(31);
    });

    it('should return 28 for February in non-leap year', () => {
      const service = createCommonService();
      expect(service.getMonthDays(1, 2023)).toBe(28);
    });

    it('should return 29 for February in leap year', () => {
      const service = createCommonService();
      expect(service.getMonthDays(1, 2024)).toBe(29);
    });

    it('should return 30 for April', () => {
      const service = createCommonService();
      expect(service.getMonthDays(3, 2024)).toBe(30);
    });
  });

  describe('findNode', () => {
    it('should find node by index', () => {
      const service = createCommonService();
      service.nodes = [
        { index: 1, lnNode: 'node1' } as any,
        { index: 2, lnNode: 'node2' } as any
      ];
      const result = service.findNode(2);
      expect(result?.lnNode).toBe('node2');
    });

    it('should return undefined for non-existent index', () => {
      const service = createCommonService();
      service.nodes = [{ index: 1, lnNode: 'node1' } as any];
      const result = service.findNode(99);
      expect(result).toBeUndefined();
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove sensitive authentication fields', () => {
      const service = createCommonService();
      const node = {
        index: 1,
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret-rune',
          lnApiPassword: 'secret-password',
          options: { url: 'http://example.com' }
        }
      } as any;
      const result = service.removeAuthSecureData(node);
      expect(result.authentication.macaroonPath).toBeUndefined();
      expect(result.authentication.runePath).toBeUndefined();
      expect(result.authentication.runeValue).toBeUndefined();
      expect(result.authentication.lnApiPassword).toBeUndefined();
      expect(result.authentication.options).toBeUndefined();
    });

    it('should handle node without authentication', () => {
      const service = createCommonService();
      const node = { index: 1 } as any;
      const result = service.removeAuthSecureData(node);
      expect(result).toEqual(node);
    });
  });

  describe('removeSecureData', () => {
    it('should remove sensitive config fields', () => {
      const service = createCommonService();
      const config = {
        rtlConfFilePath: '/path/to/config',
        rtlPass: 'password',
        multiPass: 'multipassword',
        multiPassHashed: 'hashedpassword',
        secret2FA: 'secret',
        nodes: []
      } as any;
      const result = service.removeSecureData(config);
      expect(result.rtlConfFilePath).toBeUndefined();
      expect(result.rtlPass).toBeUndefined();
      expect(result.multiPass).toBeUndefined();
      expect(result.multiPassHashed).toBeUndefined();
      expect(result.secret2FA).toBeUndefined();
    });
  });

  describe('getRequestIP', () => {
    it('should return x-forwarded-for header if present', () => {
      const service = createCommonService();
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' }
      } as any;
      expect(service.getRequestIP(req)).toBe('192.168.1.1');
    });

    it('should return req.ip as fallback', () => {
      const service = createCommonService();
      const req = {
        headers: {},
        ip: '192.168.1.2'
      } as any;
      expect(service.getRequestIP(req)).toBe('192.168.1.2');
    });

    it('should return connection.remoteAddress as fallback', () => {
      const service = createCommonService();
      const req = {
        headers: {},
        connection: { remoteAddress: '192.168.1.3' }
      } as any;
      expect(service.getRequestIP(req)).toBe('192.168.1.3');
    });

    it('should return socket.remoteAddress as fallback', () => {
      const service = createCommonService();
      const req = {
        headers: {},
        connection: {},
        socket: { remoteAddress: '192.168.1.4' }
      } as any;
      expect(service.getRequestIP(req)).toBe('192.168.1.4');
    });
  });

  describe('handleError', () => {
    it('should return proper error object for ENOENT', () => {
      const service = createCommonService();
      service.selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = { code: 'ENOENT', path: '/some/path' };
      const result = service.handleError(errRes, 'TestFile', 'Test error', service.selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.error).toContain('/some/path');
    });

    it('should handle connection refused errors', () => {
      const service = createCommonService();
      service.selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = { error: { code: 'ECONNREFUSED' } };
      const result = service.handleError(errRes, 'TestFile', 'Connection error', service.selectedNode);
      expect(result.statusCode).toBe(503);
    });

    it('should use provided status code', () => {
      const service = createCommonService();
      service.selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = { statusCode: 404, message: 'Not found' };
      const result = service.handleError(errRes, 'TestFile', 'Not found error', service.selectedNode);
      expect(result.statusCode).toBe(404);
    });

    it('should handle LND error and return proper error object', () => {
      const service = createCommonService();
      const selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = {
        options: { headers: { 'Grpc-Metadata-macaroon': 'secret-macaroon' } },
        message: 'LND error'
      };
      const result = service.handleError(errRes, 'TestFile', 'LND error', selectedNode);
      // handleError returns an error object with statusCode, message, and error
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('LND error');
    });

    it('should handle CLN error and return proper error object', () => {
      const service = createCommonService();
      const selectedNode = { lnImplementation: 'CLN' } as any;
      const errRes = {
        options: { headers: { rune: 'secret-rune' } },
        message: 'CLN error'
      };
      const result = service.handleError(errRes, 'TestFile', 'CLN error', selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('CLN error');
    });

    it('should handle ECL error and return proper error object', () => {
      const service = createCommonService();
      const selectedNode = { lnImplementation: 'ECL' } as any;
      const errRes = {
        options: { headers: { authorization: 'Basic xyz' } },
        message: 'ECL error'
      };
      const result = service.handleError(errRes, 'TestFile', 'ECL error', selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('ECL error');
    });
  });

  describe('runWithConcurrencyLimit', () => {
    it('should run tasks with concurrency limit', async () => {
      const service = createCommonService();
      const results: number[] = [];
      const tasks = [
        () => new Promise<number>((resolve) => setTimeout(() => { results.push(1); resolve(1); }, 10)),
        () => new Promise<number>((resolve) => setTimeout(() => { results.push(2); resolve(2); }, 5)),
        () => new Promise<number>((resolve) => setTimeout(() => { results.push(3); resolve(3); }, 1))
      ];

      await new Promise<void>((resolve) => {
        service.runWithConcurrencyLimit(tasks, 2, (finalResults) => {
          expect(finalResults).toEqual([1, 2, 3]);
          resolve();
        });
      });
    });

    it('should handle single task', async () => {
      const service = createCommonService();
      const tasks = [() => Promise.resolve('single')];

      await new Promise<void>((resolve) => {
        service.runWithConcurrencyLimit(tasks, 2, (results) => {
          expect(results).toEqual(['single']);
          resolve();
        });
      });
    });

    it('should handle task errors', async () => {
      const service = createCommonService();
      const tasks = [
        () => Promise.resolve('success'),
        () => Promise.reject(new Error('task failed'))
      ];

      await new Promise<void>((resolve) => {
        service.runWithConcurrencyLimit(tasks, 2, (results) => {
          expect(results[0]).toBe('success');
          expect(results[1].error).toBeInstanceOf(Error);
          resolve();
        });
      });
    });

    it('should handle invalid tasks', async () => {
      const service = createCommonService();
      const tasks = ['not a function' as any];

      await new Promise<void>((resolve) => {
        service.runWithConcurrencyLimit(tasks, 2, (results) => {
          expect(results[0].error).toBeInstanceOf(Error);
          expect(results[0].error.message).toContain('Invalid task');
          resolve();
        });
      });
    });
  });
});
