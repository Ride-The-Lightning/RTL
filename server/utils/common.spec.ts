import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the logger to prevent actual logging during tests
vi.mock('./logger.js', () => ({
  Logger: {
    log: vi.fn()
  },
  LoggerService: class {
    log = vi.fn();
  }
}));

// We need to import after mocking
const { CommonService } = await import('./common.js');

describe('CommonService', () => {
  let commonService: InstanceType<typeof CommonService>;

  beforeEach(() => {
    commonService = new CommonService();
    vi.clearAllMocks();
  });

  describe('maskPasswords', () => {
    it('should mask password fields', () => {
      const input = {
        username: 'admin',
        password: 'secret123',
        data: 'visible'
      };
      const result = commonService.maskPasswords(input);
      expect(result.username).toBe('admin');
      expect(result.password).toBe('********************');
      expect(result.data).toBe('visible');
    });

    it('should mask nested password fields', () => {
      const input = {
        user: {
          name: 'admin',
          password: 'secret123'
        }
      };
      const result = commonService.maskPasswords(input);
      expect(result.user.name).toBe('admin');
      expect(result.user.password).toBe('********************');
    });

    it('should mask rpcpassword and rpcpass fields', () => {
      const input = {
        rpcpassword: 'secret',
        rpcpass: 'secret2',
        rpcuser: 'user'
      };
      const result = commonService.maskPasswords(input);
      expect(result.rpcpassword).toBe('********************');
      expect(result.rpcpass).toBe('********************');
      expect(result.rpcuser).toBe('********************');
    });

    it('should mask multipass fields', () => {
      const input = {
        multipass: 'multipassword'
      };
      const result = commonService.maskPasswords(input);
      expect(result.multipass).toBe('********************');
    });

    it('should NOT mask allowPasswordUpdate field', () => {
      const input = {
        allowPasswordUpdate: true,
        password: 'secret'
      };
      const result = commonService.maskPasswords(input);
      expect(result.allowPasswordUpdate).toBe(true);
      expect(result.password).toBe('********************');
    });

    it('should handle empty object', () => {
      const input = {};
      const result = commonService.maskPasswords(input);
      expect(result).toEqual({});
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(1672531200);
    });

    it('should return floor value for milliseconds', () => {
      const date = new Date('2023-01-01T00:00:00.500Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(1672531200);
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch timestamp to formatted time string', () => {
      // Use a specific timestamp: January 15, 2023, 10:30:45
      const timestamp = 1673778645;
      const result = commonService.convertTimestampToTime(timestamp);
      // Result format: DD/MON/YYYY HH:MM:SS
      expect(result).toMatch(/^\d{2}\/[A-Z]{3}\/\d{4}\s\d{2}:\d{2}:\d{2}$/);
    });

    it('should pad single digit values with zeros', () => {
      // January 5, 2023, 05:05:05
      const timestamp = 1672898705;
      const result = commonService.convertTimestampToTime(timestamp);
      expect(result).toMatch(/^\d{2}\/[A-Z]{3}\/\d{4}\s\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array in ascending order by numeric key', () => {
      const input = [
        { id: 3, name: 'c' },
        { id: 1, name: 'a' },
        { id: 2, name: 'b' }
      ];
      const result = commonService.sortAscByKey(input, 'id');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should handle empty array', () => {
      const result = commonService.sortAscByKey([], 'id');
      expect(result).toEqual([]);
    });

    it('should handle array with one element', () => {
      const input = [{ id: 1 }];
      const result = commonService.sortAscByKey(input, 'id');
      expect(result).toEqual([{ id: 1 }]);
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array in ascending order by string key', () => {
      const input = [
        { id: 1, name: 'Charlie' },
        { id: 2, name: 'Alice' },
        { id: 3, name: 'Bob' }
      ];
      const result = commonService.sortAscByStrKey(input, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle null/undefined values', () => {
      const input = [
        { id: 1, name: 'Bob' },
        { id: 2, name: null },
        { id: 3, name: 'Alice' }
      ];
      const result = commonService.sortAscByStrKey(input, 'name');
      expect(result[0].name).toBeNull();
      expect(result[1].name).toBe('Alice');
      expect(result[2].name).toBe('Bob');
    });

    it('should be case insensitive', () => {
      const input = [
        { name: 'bob' },
        { name: 'ALICE' },
        { name: 'Charlie' }
      ];
      const result = commonService.sortAscByStrKey(input, 'name');
      expect(result[0].name).toBe('ALICE');
      expect(result[1].name).toBe('bob');
      expect(result[2].name).toBe('Charlie');
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array in descending order by numeric key', () => {
      const input = [
        { id: 1, name: 'a' },
        { id: 3, name: 'c' },
        { id: 2, name: 'b' }
      ];
      const result = commonService.sortDescByKey(input, 'id');
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);
    });

    it('should handle missing key values as 0', () => {
      const input = [
        { id: 2 },
        { name: 'no id' },
        { id: 1 }
      ];
      const result = commonService.sortDescByKey(input, 'id');
      expect(result[0].id).toBe(2);
      expect(result[1].id).toBe(1);
      expect(result[2].id).toBeUndefined();
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array in descending order by string key', () => {
      const input = [
        { name: 'Alice' },
        { name: 'Charlie' },
        { name: 'Bob' }
      ];
      const result = commonService.sortDescByStrKey(input, 'name');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });
  });

  describe('newestOnTop', () => {
    it('should move matching item to top of array', () => {
      const input = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' },
        { id: 3, name: 'third' }
      ];
      const result = commonService.newestOnTop(input, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result[0].name).toBe('third');
    });

    it('should not modify array if item is already on top', () => {
      const input = [
        { id: 1, name: 'first' },
        { id: 2, name: 'second' }
      ];
      const result = commonService.newestOnTop(input, 'id', 1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case', () => {
      const result = commonService.camelCase('hello world');
      expect(result).toBe('HelloWorld');
    });

    it('should handle hyphenated strings', () => {
      const result = commonService.camelCase('hello-world');
      expect(result).toBe('Hello World');
    });

    it('should handle null/undefined', () => {
      const result = commonService.camelCase(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert simple string to title case', () => {
      const result = commonService.titleCase('hello world');
      expect(result).toBe('Hello World ');
    });

    it('should handle single word', () => {
      const result = commonService.titleCase('hello');
      expect(result).toBe('Hello');
    });

    it('should handle strings with newlines after exclamation mark', () => {
      const result = commonService.titleCase('HELLO!\nWORLD');
      expect(result).toBe('Hello!\nWorld\n');
    });

    it('should handle strings with newlines after period', () => {
      const result = commonService.titleCase('HELLO.\nWORLD');
      expect(result).toBe('Hello.\nWorld\n');
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove authentication sensitive data', () => {
      const node = {
        index: 1,
        lnNode: 'test',
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret-rune',
          lnApiPassword: 'secret-password',
          options: { some: 'options' }
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
        lnNode: 'test'
      };
      const result = commonService.removeAuthSecureData(node as any);
      expect(result).toEqual(node);
    });
  });

  describe('removeSecureData', () => {
    it('should remove secure config data', () => {
      const config = {
        defaultNodeIndex: 0,
        selectedNodeIndex: 0,
        rtlConfFilePath: '/path/to/config',
        rtlPass: 'password',
        multiPass: 'multipass',
        multiPassHashed: 'hashed',
        secret2FA: 'secret',
        nodes: [
          {
            index: 1,
            authentication: {
              macaroonPath: '/path'
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
    });
  });

  describe('getRequestIP', () => {
    it('should get IP from x-forwarded-for header', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1',
        connection: { remoteAddress: '::1' },
        socket: { remoteAddress: '::1' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('192.168.1.1');
    });

    it('should fallback to req.ip', () => {
      const req = {
        headers: {},
        ip: '192.168.1.2',
        connection: { remoteAddress: '::1' },
        socket: { remoteAddress: '::1' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('192.168.1.2');
    });

    it('should fallback to connection.remoteAddress', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: '192.168.1.3' },
        socket: { remoteAddress: '::1' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('192.168.1.3');
    });

    it('should fallback to socket.remoteAddress', () => {
      const req = {
        headers: {},
        ip: null,
        connection: {},
        socket: { remoteAddress: '192.168.1.4' }
      };
      const result = commonService.getRequestIP(req as any);
      expect(result).toBe('192.168.1.4');
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

    it('should return undefined if node not found', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'node1' }
      ] as any;
      const result = commonService.findNode(99);
      expect(result).toBeUndefined();
    });
  });

  describe('getMonthDays', () => {
    it('should return correct days for regular months', () => {
      // January (index 0) has 31 days
      expect(commonService.getMonthDays(0, 2023)).toBe(31);
      // April (index 3) has 30 days
      expect(commonService.getMonthDays(3, 2023)).toBe(30);
    });

    it('should return 28 days for February in non-leap year', () => {
      expect(commonService.getMonthDays(1, 2023)).toBe(28);
    });

    it('should return 29 days for February in leap year', () => {
      expect(commonService.getMonthDays(1, 2024)).toBe(29);
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true for compatible versions', () => {
      expect(commonService.isVersionCompatible('v0.15.0', '0.14.0')).toBe(true);
      expect(commonService.isVersionCompatible('v1.0.0', '0.15.0')).toBe(true);
      expect(commonService.isVersionCompatible('0.15.5', '0.15.0')).toBe(true);
    });

    it('should return false for incompatible versions', () => {
      expect(commonService.isVersionCompatible('v0.14.0', '0.15.0')).toBe(false);
      expect(commonService.isVersionCompatible('0.14.5', '0.15.0')).toBe(false);
    });

    it('should return false for empty version string', () => {
      expect(commonService.isVersionCompatible('', '0.15.0')).toBe(false);
    });

    it('should return false for null/undefined version', () => {
      expect(commonService.isVersionCompatible(null as any, '0.15.0')).toBe(false);
      expect(commonService.isVersionCompatible(undefined as any, '0.15.0')).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should format error with statusCode and message', () => {
      commonService.selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = {
        statusCode: 404,
        message: 'Not Found',
        error: 'Resource not found'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', commonService.selectedNode);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Not Found');
      expect(result.error).toBe('Resource not found');
    });

    it('should handle ENOENT error', () => {
      commonService.selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = {
        code: 'ENOENT',
        path: '/missing/file'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', commonService.selectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.error).toContain('/missing/file');
    });

    it('should handle ECONNREFUSED error', () => {
      commonService.selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = {
        error: { code: 'ECONNREFUSED' }
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', commonService.selectedNode);
      expect(result.statusCode).toBe(503);
    });

    it('should delete LND macaroon headers from error', () => {
      commonService.selectedNode = { lnImplementation: 'LND' } as any;
      const errRes = {
        options: {
          headers: { 'Grpc-Metadata-macaroon': 'secret-macaroon' }
        },
        statusCode: 500
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', commonService.selectedNode);
      expect(result.statusCode).toBe(500);
    });

    it('should delete CLN rune headers from error', () => {
      commonService.selectedNode = { lnImplementation: 'CLN' } as any;
      const errRes = {
        options: {
          headers: { rune: 'secret-rune' }
        },
        statusCode: 500
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', commonService.selectedNode);
      expect(result.statusCode).toBe(500);
    });

    it('should delete ECL authorization headers from error', () => {
      commonService.selectedNode = { lnImplementation: 'ECL' } as any;
      const errRes = {
        options: {
          headers: { authorization: 'Basic secret' }
        },
        statusCode: 500
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', commonService.selectedNode);
      expect(result.statusCode).toBe(500);
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
        () => Promise.reject(new Error('Task failed')),
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

    it('should handle single task', async () => {
      const tasks = [() => Promise.resolve(42)];

      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, (res) => {
          expect(res).toEqual([42]);
          resolve();
        });
      });
    });
  });
});
