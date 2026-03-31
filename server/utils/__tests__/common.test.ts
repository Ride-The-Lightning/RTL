import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommonService } from '../common.js';

describe('CommonService', () => {
  let commonService: CommonService;

  beforeEach(() => {
    commonService = new CommonService();
  });

  describe('maskPasswords', () => {
    it('should mask password fields with asterisks', () => {
      const obj = { password: 'secret123', username: 'admin' };
      const result = commonService.maskPasswords(obj);
      expect(result.password).toBe('********************');
      expect(result.username).toBe('admin');
    });

    it('should mask nested password fields', () => {
      const obj = { config: { dbPassword: 'secret', host: 'localhost' } };
      const result = commonService.maskPasswords(obj);
      expect(result.config.dbPassword).toBe('********************');
      expect(result.config.host).toBe('localhost');
    });

    it('should mask rpcpass and rpcpassword fields', () => {
      const obj = { rpcpass: 'pass1', rpcpassword: 'pass2', rpcuser: 'user1' };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcpass).toBe('********************');
      expect(result.rpcpassword).toBe('********************');
      expect(result.rpcuser).toBe('********************');
    });

    it('should mask multipass field', () => {
      const obj = { multipass: 'multipassvalue' };
      const result = commonService.maskPasswords(obj);
      expect(result.multipass).toBe('********************');
    });

    it('should not mask allowPasswordUpdate field', () => {
      const obj = { allowPasswordUpdate: true };
      const result = commonService.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = commonService.maskPasswords(obj);
      expect(result).toEqual({});
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2024-01-15T10:30:00.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(Math.floor(date.getTime() / 1000));
    });

    it('should handle epoch start date', () => {
      const date = new Date('1970-01-01T00:00:00.000Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(0);
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch timestamp to formatted string', () => {
      // Test with a known timestamp - Jan 15, 2024 10:30:45 UTC
      const timestamp = 1705314645;
      const result = commonService.convertTimestampToTime(timestamp);
      // Result format: DD/MMM/YYYY HH:MM:SS (in local timezone)
      expect(result).toMatch(/\d{2}\/[A-Z]{3}\/\d{4}\s\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array in ascending order by numeric key', () => {
      const array = [{ value: 3 }, { value: 1 }, { value: 2 }];
      const result = commonService.sortAscByKey(array, 'value');
      expect(result[0].value).toBe(1);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(3);
    });

    it('should handle empty array', () => {
      const array: any[] = [];
      const result = commonService.sortAscByKey(array, 'value');
      expect(result).toEqual([]);
    });

    it('should handle single element array', () => {
      const array = [{ value: 5 }];
      const result = commonService.sortAscByKey(array, 'value');
      expect(result).toEqual([{ value: 5 }]);
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array in ascending order by string key', () => {
      const array = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const result = commonService.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle case insensitivity', () => {
      const array = [{ name: 'bob' }, { name: 'Alice' }, { name: 'BOB' }];
      const result = commonService.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe('Alice');
    });

    it('should handle undefined values', () => {
      const array = [{ name: 'Bob' }, { name: undefined }, { name: 'Alice' }];
      const result = commonService.sortAscByStrKey(array, 'name');
      expect(result[0].name).toBe(undefined);
      expect(result[1].name).toBe('Alice');
      expect(result[2].name).toBe('Bob');
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array in descending order by numeric key', () => {
      const array = [{ value: 1 }, { value: 3 }, { value: 2 }];
      const result = commonService.sortDescByKey(array, 'value');
      expect(result[0].value).toBe(3);
      expect(result[1].value).toBe(2);
      expect(result[2].value).toBe(1);
    });

    it('should handle zero and undefined values', () => {
      const array = [{ value: 0 }, { value: undefined }, { value: 5 }];
      const result = commonService.sortDescByKey(array, 'value');
      expect(result[0].value).toBe(5);
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array in descending order by string key', () => {
      const array = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
      const result = commonService.sortDescByStrKey(array, 'name');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });
  });

  describe('newestOnTop', () => {
    it('should move matching item to the top of array', () => {
      const array = [
        { id: 1, name: 'First' },
        { id: 2, name: 'Second' },
        { id: 3, name: 'Third' }
      ];
      const result = commonService.newestOnTop(array, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(1);
      expect(result[2].id).toBe(2);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case with uppercase first letters', () => {
      const result = commonService.camelCase('hello world');
      expect(result).toBe('HelloWorld');
    });

    it('should handle hyphenated strings', () => {
      const result = commonService.camelCase('hello-world');
      expect(result).toBe('Hello World');
    });

    it('should handle undefined input', () => {
      const result = commonService.camelCase(undefined as any);
      expect(result).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert single word to title case', () => {
      const result = commonService.titleCase('hello');
      expect(result).toBe('Hello');
    });

    it('should convert multiple words to title case', () => {
      const result = commonService.titleCase('hello world');
      expect(result).toBe('Hello World ');
    });

    it('should handle sentences with newlines and exclamation marks', () => {
      const result = commonService.titleCase('HELLO!\nWORLD');
      expect(result).toBe('Hello!\nWorld\n');
    });

    it('should handle sentences with newlines and periods', () => {
      const result = commonService.titleCase('HELLO.\nWORLD');
      expect(result).toBe('Hello.\nWorld\n');
    });
  });

  describe('getMonthDays', () => {
    it('should return correct days for January', () => {
      const result = commonService.getMonthDays(0, 2024);
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
      const result = commonService.getMonthDays(3, 2024);
      expect(result).toBe(30);
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true when current version is greater than check version', () => {
      const result = commonService.isVersionCompatible('v1.5.0', '1.4.0');
      expect(result).toBe(true);
    });

    it('should return true when versions are equal', () => {
      const result = commonService.isVersionCompatible('1.5.0', '1.5.0');
      expect(result).toBe(true);
    });

    it('should return false when current version is less than check version', () => {
      const result = commonService.isVersionCompatible('1.4.0', '1.5.0');
      expect(result).toBe(false);
    });

    it('should handle version with v prefix', () => {
      const result = commonService.isVersionCompatible('v2.0.0', '1.9.9');
      expect(result).toBe(true);
    });

    it('should return false for empty version string', () => {
      const result = commonService.isVersionCompatible('', '1.0.0');
      expect(result).toBe(false);
    });

    it('should return false for invalid version string', () => {
      const result = commonService.isVersionCompatible('invalid', '1.0.0');
      expect(result).toBe(false);
    });

    it('should handle major version comparison correctly', () => {
      const result = commonService.isVersionCompatible('2.0.0', '1.9.9');
      expect(result).toBe(true);
    });
  });

  describe('handleError', () => {
    const mockSelectedNode = {
      index: 1,
      lnNode: 'TestNode',
      lnImplementation: 'LND',
      settings: { logFile: '', logLevel: 'ERROR' }
    } as any;

    it('should create error object with default status 500', () => {
      const errRes = { message: 'Something went wrong' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', mockSelectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toBe('Something went wrong');
    });

    it('should preserve status code from error response', () => {
      const errRes = { statusCode: 404, message: 'Not found' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', mockSelectedNode);
      expect(result.statusCode).toBe(404);
    });

    it('should handle ENOENT error code', () => {
      const errRes = { code: 'ENOENT', path: '/some/path' };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', mockSelectedNode);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.message).toContain('/some/path');
    });

    it('should handle ECONNREFUSED with status 503', () => {
      const errRes = { error: { code: 'ECONNREFUSED' } };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', mockSelectedNode);
      expect(result.statusCode).toBe(503);
    });

    it('should extract nested error messages', () => {
      const errRes = { error: { error: { error: 'Deep nested error' } } };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', mockSelectedNode);
      expect(result.error).toBe('Deep nested error');
    });

    it('should remove LND macaroon headers from error', () => {
      const errRes = {
        statusCode: 500,
        options: { headers: { 'Grpc-Metadata-macaroon': 'secret-macaroon' } },
        message: 'Error'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', mockSelectedNode);
      expect(result.statusCode).toBe(500);
    });

    it('should remove CLN rune headers from error', () => {
      const clnNode = { ...mockSelectedNode, lnImplementation: 'CLN' };
      const errRes = {
        statusCode: 500,
        options: { headers: { rune: 'secret-rune' } },
        message: 'Error'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', clnNode);
      expect(result.statusCode).toBe(500);
    });

    it('should remove ECL authorization headers from error', () => {
      const eclNode = { ...mockSelectedNode, lnImplementation: 'ECL' };
      const errRes = {
        statusCode: 500,
        options: { headers: { authorization: 'Basic secret' } },
        message: 'Error'
      };
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', eclNode);
      expect(result.statusCode).toBe(500);
    });

    it('should handle string error', () => {
      const errRes = 'Simple string error';
      const result = commonService.handleError(errRes, 'TestFile', 'Test Error', mockSelectedNode);
      expect(result.error).toBe('Simple string error');
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

  describe('removeAuthSecureData', () => {
    it('should remove sensitive authentication data from node', () => {
      const node = {
        index: 1,
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret-rune',
          lnApiPassword: 'password',
          options: { some: 'option' }
        }
      } as any;
      const result = commonService.removeAuthSecureData(node);
      expect(result.authentication.macaroonPath).toBeUndefined();
      expect(result.authentication.runePath).toBeUndefined();
      expect(result.authentication.runeValue).toBeUndefined();
      expect(result.authentication.lnApiPassword).toBeUndefined();
      expect(result.authentication.options).toBeUndefined();
    });

    it('should handle node without authentication', () => {
      const node = { index: 1 } as any;
      const result = commonService.removeAuthSecureData(node);
      expect(result).toEqual({ index: 1 });
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
      } as any;
      const result = commonService.removeSecureData(config);
      expect(result.rtlConfFilePath).toBeUndefined();
      expect(result.rtlPass).toBeUndefined();
      expect(result.multiPass).toBeUndefined();
      expect(result.secret2FA).toBeUndefined();
    });
  });
});
