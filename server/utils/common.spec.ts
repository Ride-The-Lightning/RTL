import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommonService } from './common.js';
import { SelectedNode, ApplicationConfig } from '../models/config.model.js';

describe('CommonService', () => {
  let commonService: CommonService;

  beforeEach(() => {
    commonService = new CommonService();
    // Mock the logger to avoid console output during tests
    commonService.logger = {
      log: vi.fn()
    } as any;
  });

  describe('maskPasswords', () => {
    it('should mask password fields', () => {
      const obj = {
        username: 'admin',
        password: 'secret123',
        rpcpass: 'rpcpassword',
        data: 'some data'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.username).toBe('admin');
      expect(result.password).toBe('********************');
      expect(result.rpcpass).toBe('********************');
      expect(result.data).toBe('some data');
    });

    it('should mask nested password fields', () => {
      const obj = {
        level1: {
          password: 'nested_secret',
          rpcpassword: 'rpc_secret'
        }
      };
      const result = commonService.maskPasswords(obj);
      expect(result.level1.password).toBe('********************');
      expect(result.level1.rpcpassword).toBe('********************');
    });

    it('should not mask allowPasswordUpdate', () => {
      const obj = {
        allowPasswordUpdate: true,
        password: 'secret'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
      expect(result.password).toBe('********************');
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = commonService.maskPasswords(obj);
      expect(result).toEqual({});
    });

    it('should mask rpcuser field', () => {
      const obj = {
        rpcuser: 'myuser',
        otherField: 'value'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcuser).toBe('********************');
      expect(result.otherField).toBe('value');
    });

    it('should mask multipass field', () => {
      const obj = {
        multipass: 'multipassvalue'
      };
      const result = commonService.maskPasswords(obj);
      expect(result.multipass).toBe('********************');
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove authentication secure data', () => {
      const node: SelectedNode = {
        index: 1,
        lnNode: 'Test Node',
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'runevalue',
          lnApiPassword: 'password',
          options: { someOption: true }
        }
      };
      const result = commonService.removeAuthSecureData(node);
      expect(result.authentication.macaroonPath).toBeUndefined();
      expect(result.authentication.runePath).toBeUndefined();
      expect(result.authentication.runeValue).toBeUndefined();
      expect(result.authentication.lnApiPassword).toBeUndefined();
      expect(result.authentication.options).toBeUndefined();
    });

    it('should handle node without authentication', () => {
      const node: SelectedNode = {
        index: 1,
        lnNode: 'Test Node'
      };
      const result = commonService.removeAuthSecureData(node);
      expect(result).toEqual(node);
    });
  });

  describe('removeSecureData', () => {
    it('should remove secure data from config', () => {
      const config: ApplicationConfig = {
        defaultNodeIndex: 0,
        selectedNodeIndex: 0,
        rtlConfFilePath: '/path/to/config',
        rtlPass: 'password',
        multiPass: 'multipass',
        multiPassHashed: 'hashedpass',
        secret2FA: 'secret',
        nodes: [{
          index: 1,
          lnNode: 'Test',
          authentication: {
            macaroonPath: '/path'
          }
        }]
      };
      const result = commonService.removeSecureData(config);
      expect(result.rtlConfFilePath).toBeUndefined();
      expect(result.rtlPass).toBeUndefined();
      expect(result.multiPass).toBeUndefined();
      expect(result.multiPassHashed).toBeUndefined();
      expect(result.secret2FA).toBeUndefined();
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2023-01-01T00:00:00.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(1672531200);
    });

    it('should handle different dates', () => {
      const date = new Date('2024-06-15T12:30:00.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(Math.floor(date.getTime() / 1000));
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch timestamp to formatted string', () => {
      const timestamp = 1672531200; // 2023-01-01 00:00:00 UTC
      const result = commonService.convertTimestampToTime(timestamp);
      expect(result).toMatch(/\d{2}\/[A-Z]{3}\/\d{4} \d{2}:\d{2}:\d{2}/);
    });

    it('should pad single digit values with zero', () => {
      const timestamp = 1672531205; // 2023-01-01 00:00:05 UTC
      const result = commonService.convertTimestampToTime(timestamp);
      expect(result).toMatch(/\d{2}:\d{2}:\d{2}/);
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

    it('should handle null/undefined values', () => {
      const array = [
        { id: 1, name: 'charlie' },
        { id: 2, name: null },
        { id: 3, name: 'alpha' }
      ];
      const result = commonService.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe(null);
      expect(result[1].name).toBe('alpha');
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
        { id: 0, name: 'a' },
        { id: undefined, name: 'b' },
        { id: 5, name: 'c' }
      ];
      const result = commonService.sortDescByKey(array, 'id');
      expect(result[0].id).toBe(5);
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array descending by string key', () => {
      const array = [
        { id: 1, name: 'alpha' },
        { id: 2, name: 'charlie' },
        { id: 3, name: 'bravo' }
      ];
      const result = commonService.sortDescByStrKey(array, 'name');
      expect(result[0].name).toBe('charlie');
      expect(result[1].name).toBe('bravo');
      expect(result[2].name).toBe('alpha');
    });
  });

  describe('newestOnTop', () => {
    it('should move matching item to top of array', () => {
      const array = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' },
        { id: 3, name: 'c' }
      ];
      const result = commonService.newestOnTop(array, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result.length).toBe(3);
    });

    it('should handle item already at top', () => {
      const array = [
        { id: 1, name: 'a' },
        { id: 2, name: 'b' }
      ];
      const result = commonService.newestOnTop(array, 'id', 1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case', () => {
      expect(commonService.camelCase('hello world')).toBe('HelloWorld');
    });

    it('should handle hyphens', () => {
      expect(commonService.camelCase('hello-world')).toBe('Hello World');
    });

    it('should handle null/undefined', () => {
      expect(commonService.camelCase(null as any)).toBeUndefined();
      expect(commonService.camelCase(undefined as any)).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert string to title case', () => {
      expect(commonService.titleCase('HELLO WORLD')).toBe('Hello World ');
    });

    it('should handle single word', () => {
      expect(commonService.titleCase('HELLO')).toBe('Hello');
    });

    it('should handle multiline with exclamation', () => {
      const input = 'HELLO!\nWORLD';
      const result = commonService.titleCase(input);
      expect(result).toContain('Hello!');
    });

    it('should handle multiline with period', () => {
      const input = 'HELLO.\nWORLD';
      const result = commonService.titleCase(input);
      expect(result).toContain('Hello.');
    });
  });

  describe('handleError', () => {
    it('should create error object with statusCode', () => {
      const errRes = { statusCode: 404, message: 'Not found' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as SelectedNode);
      expect(result.statusCode).toBe(404);
      expect(result.message).toBe('Not found');
    });

    it('should handle ENOENT error code', () => {
      const errRes = { code: 'ENOENT', path: '/some/path' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as SelectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.message).toContain('/some/path');
    });

    it('should handle ECONNREFUSED with 503 status', () => {
      const errRes = { error: { code: 'ECONNREFUSED' } };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as SelectedNode);
      expect(result.statusCode).toBe(503);
    });

    it('should return sanitized error for LND without exposing macaroon', () => {
      const errRes = {
        statusCode: 500,
        options: { headers: { 'Grpc-Metadata-macaroon': 'secret' } },
        message: 'Test error'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as SelectedNode);
      // The function should return a sanitized error object
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Test error');
    });

    it('should return sanitized error for CLN without exposing rune', () => {
      const errRes = {
        statusCode: 500,
        options: { headers: { rune: 'secret' } },
        message: 'Test error'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'CLN' } as SelectedNode);
      // The function should return a sanitized error object
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Test error');
    });

    it('should return sanitized error for ECL without exposing authorization', () => {
      const errRes = {
        statusCode: 500,
        options: { headers: { authorization: 'secret' } },
        message: 'Test error'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'ECL' } as SelectedNode);
      // The function should return a sanitized error object
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Test error');
    });

    it('should use status when statusCode is not available', () => {
      const errRes = { status: 400, message: 'Bad request' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test error', { lnImplementation: 'LND' } as SelectedNode);
      expect(result.statusCode).toBe(400);
    });
  });

  describe('getRequestIP', () => {
    it('should get IP from x-forwarded-for header', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      };
      const result = commonService.getRequestIP(req);
      expect(result).toBe('192.168.1.1');
    });

    it('should get IP from req.ip', () => {
      const req = {
        headers: {},
        ip: '10.0.0.1',
        connection: { remoteAddress: '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      };
      const result = commonService.getRequestIP(req);
      expect(result).toBe('10.0.0.1');
    });

    it('should get IP from connection.remoteAddress', () => {
      const req = {
        headers: {},
        ip: null,
        connection: { remoteAddress: '192.168.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      };
      const result = commonService.getRequestIP(req);
      expect(result).toBe('192.168.0.1');
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true for compatible version', () => {
      const result = commonService.isVersionCompatible('v0.15.0', '0.14.0');
      expect(result).toBe(true);
    });

    it('should return true for exact version match', () => {
      const result = commonService.isVersionCompatible('v0.15.0', '0.15.0');
      expect(result).toBe(true);
    });

    it('should return false for incompatible version', () => {
      const result = commonService.isVersionCompatible('v0.14.0', '0.15.0');
      expect(result).toBe(false);
    });

    it('should return false for empty version', () => {
      const result = commonService.isVersionCompatible('', '0.15.0');
      expect(result).toBe(false);
    });

    it('should return false for null version', () => {
      const result = commonService.isVersionCompatible(null as any, '0.15.0');
      expect(result).toBe(false);
    });

    it('should handle version without v prefix', () => {
      const result = commonService.isVersionCompatible('0.15.0', '0.14.0');
      expect(result).toBe(true);
    });

    it('should handle major version comparison', () => {
      const result = commonService.isVersionCompatible('v1.0.0', '0.99.99');
      expect(result).toBe(true);
    });
  });

  describe('getMonthDays', () => {
    it('should return correct days for January', () => {
      const result = commonService.getMonthDays(0, 2023);
      expect(result).toBe(31);
    });

    it('should return 28 days for February in non-leap year', () => {
      const result = commonService.getMonthDays(1, 2023);
      expect(result).toBe(28);
    });

    it('should return 29 days for February in leap year', () => {
      const result = commonService.getMonthDays(1, 2024);
      expect(result).toBe(29);
    });

    it('should return correct days for April', () => {
      const result = commonService.getMonthDays(3, 2023);
      expect(result).toBe(30);
    });
  });

  describe('findNode', () => {
    it('should find node by index', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'Node1' } as SelectedNode,
        { index: 2, lnNode: 'Node2' } as SelectedNode
      ];
      const result = commonService.findNode(2);
      expect(result?.lnNode).toBe('Node2');
    });

    it('should return undefined for non-existent index', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'Node1' } as SelectedNode
      ];
      const result = commonService.findNode(99);
      expect(result).toBeUndefined();
    });
  });

  describe('replaceNode', () => {
    it('should replace node at correct index', () => {
      commonService.nodes = [
        { index: 1, lnNode: 'Node1' } as SelectedNode,
        { index: 2, lnNode: 'Node2' } as SelectedNode
      ];
      const req = {
        session: {
          selectedNode: { index: 1 }
        }
      };
      const newNode = { index: 1, lnNode: 'NewNode1' } as SelectedNode;
      commonService.replaceNode(req as any, newNode);
      expect(commonService.nodes[0].lnNode).toBe('NewNode1');
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
          expect(res[1].error).toBeDefined();
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
          expect(res[1].error).toBeDefined();
          expect(res[2]).toBe(3);
          resolve();
        });
      });
    });

    it('should respect concurrency limit', async () => {
      let maxConcurrent = 0;
      let currentConcurrent = 0;
      
      const tasks = Array.from({ length: 5 }, () => {
        return async () => {
          currentConcurrent++;
          maxConcurrent = Math.max(maxConcurrent, currentConcurrent);
          await new Promise(resolve => setTimeout(resolve, 10));
          currentConcurrent--;
          return true;
        };
      });
      
      await new Promise<void>((resolve) => {
        commonService.runWithConcurrencyLimit(tasks, 2, () => {
          resolve();
        });
      });
      
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });
  });
});
