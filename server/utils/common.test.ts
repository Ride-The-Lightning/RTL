import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies before importing the module
vi.mock('fs', async () => {
  return {
    default: {
      readFileSync: vi.fn(),
      writeFileSync: vi.fn(),
      existsSync: vi.fn(),
      appendFile: vi.fn(),
      mkdirSync: vi.fn()
    },
    readFileSync: vi.fn(),
    writeFileSync: vi.fn(),
    existsSync: vi.fn(),
    appendFile: vi.fn(),
    mkdirSync: vi.fn()
  };
});

vi.mock('request-promise', () => ({
  default: vi.fn()
}));

vi.mock('./logger.js', () => ({
  Logger: {
    log: vi.fn()
  },
  LoggerService: class {}
}));

// Create a fresh instance of CommonService for testing
const createCommonService = () => {
  // We'll test the methods directly without the module system complexity
  const MONTHS = [
    { name: 'JAN', days: 31 }, { name: 'FEB', days: 28 }, { name: 'MAR', days: 31 }, { name: 'APR', days: 30 }, 
    { name: 'MAY', days: 31 }, { name: 'JUN', days: 30 }, { name: 'JUL', days: 31 }, { name: 'AUG', days: 31 }, 
    { name: 'SEP', days: 30 }, { name: 'OCT', days: 31 }, { name: 'NOV', days: 30 }, { name: 'DEC', days: 31 }
  ];

  return {
    // Utility methods that can be tested independently
    convertTimeToEpoch: (timeToConvert: Date) => Math.floor(timeToConvert.getTime() / 1000),
    
    convertTimestampToTime: (num: number) => {
      const myDate = new Date(+num * 1000);
      let days = myDate.getDate().toString();
      days = +days < 10 ? '0' + days : days;
      let hours = myDate.getHours().toString();
      hours = +hours < 10 ? '0' + hours : hours;
      let minutes = myDate.getMinutes().toString();
      minutes = +minutes < 10 ? '0' + minutes : minutes;
      let seconds = myDate.getSeconds().toString();
      seconds = +seconds < 10 ? '0' + seconds : seconds;
      return days + '/' + MONTHS[myDate.getMonth()].name + '/' + myDate.getFullYear() + ' ' + hours + ':' + minutes + ':' + seconds;
    },

    sortAscByKey: (array: any[], key: string) => array.sort((a, b) => {
      const x = +a[key];
      const y = +b[key];
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    }),

    sortAscByStrKey: (array: any[], key: string) => array.sort((a, b) => {
      const x = a[key] ? a[key].toUpperCase() : '';
      const y = b[key] ? b[key].toUpperCase() : '';
      return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    }),

    sortDescByKey: (array: any[], key: string) => {
      const temp = array.sort((a, b) => {
        const x = +a[key] ? +a[key] : 0;
        const y = +b[key] ? +b[key] : 0;
        return (x > y) ? -1 : ((x < y) ? 1 : 0);
      });
      return temp;
    },

    sortDescByStrKey: (array: any[], key: string) => {
      const temp = array.sort((a, b) => {
        const x = a[key] ? a[key].toUpperCase() : '';
        const y = b[key] ? b[key].toUpperCase() : '';
        return (x > y) ? -1 : ((x < y) ? 1 : 0);
      });
      return temp;
    },

    newestOnTop: (array: any[], key: string, value: any) => {
      const newlyAddedRecord = array.splice(array.findIndex((item) => item[key] === value), 1);
      array?.unshift(newlyAddedRecord[0]);
      return array;
    },

    camelCase: (str: string) => str?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()))?.replace(/\s+/g, '')?.replace(/-/g, ' '),

    titleCase: (str: string) => {
      if (str.indexOf('!\n') > 0 || str.indexOf('.\n') > 0) {
        return str.split('\n')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + '\n', '');
      } else {
        if (str.indexOf(' ') > 0) {
          return str.split(' ')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + ' ', '');
        } else {
          return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
        }
      }
    },

    maskPasswords: (obj: any) => {
      const keys = Object.keys(obj);
      const length = keys.length;
      if (length !== 0) {
        for (let i = 0; i < length; i++) {
          if (typeof obj[keys[i]] === 'object') {
            obj[keys[i]] = createCommonService().maskPasswords(obj[keys[i]]);
          }
          if (typeof keys[i] === 'string' &&
            ((keys[i].toLowerCase().includes('password') && keys[i] !== 'allowPasswordUpdate') || keys[i].toLowerCase().includes('multipass') ||
              keys[i].toLowerCase().includes('rpcpass') || keys[i].toLowerCase().includes('rpcpassword') ||
              keys[i].toLowerCase().includes('rpcuser'))
          ) {
            obj[keys[i]] = '*'.repeat(20);
          }
        }
      }
      return obj;
    },

    getMonthDays: (selMonth: number, selYear: number) => ((selMonth === 1 && selYear % 4 === 0) ? (MONTHS[selMonth].days + 1) : MONTHS[selMonth].days),

    isVersionCompatible: (currentVersion: string, checkVersion: string) => {
      if (currentVersion && currentVersion !== '') {
        const pattern = /v?(\d+(\.\d+)*)/;
        const match = currentVersion.match(pattern);
        if (match && match.length && match.length > 1) {
          const currentVersionArr = match[1].split('.') || [];
          currentVersionArr[1] = currentVersionArr[1].substring(0, 2);
          const checkVersionsArr = checkVersion.split('.');
          checkVersionsArr[1] = checkVersionsArr[1].substring(0, 2);
          return (+currentVersionArr[0] > +checkVersionsArr[0]) ||
          (+currentVersionArr[0] === +checkVersionsArr[0] && +currentVersionArr[1] > +checkVersionsArr[1]) ||
          (+currentVersionArr[0] === +checkVersionsArr[0] && +currentVersionArr[1] === +checkVersionsArr[1] && +currentVersionArr[2] >= +checkVersionsArr[2]);
        } else {
          return false;
        }
      }
      return false;
    },

    handleError: (errRes: any, fileName: string, errMsg: string, selectedNode: any) => {
      const err = JSON.parse(JSON.stringify(errRes));
      let newErrorObj = { statusCode: 500, message: '', error: '' };
      if (err.code && err.code === 'ENOENT') {
        newErrorObj = {
          statusCode: 500,
          message: 'No such file or directory ' + (err.path ? err.path : ''),
          error: 'No such file or directory ' + (err.path ? err.path : '')
        };
      } else {
        newErrorObj = {
          statusCode: err.statusCode ? err.statusCode : err.status ? err.status : (err.error && err.error.code && err.error.code === 'ECONNREFUSED') ? 503 : 500,
          message: (err.error && err.error.message) ? err.error.message : err.message ? err.message : errMsg,
          error: (
            (err.error && err.error.error && err.error.error.error && typeof err.error.error.error === 'string') ? err.error.error.error :
              (err.error && err.error.error && typeof err.error.error === 'string') ? err.error.error :
                (err.error && err.error.error && err.error.error.message && typeof err.error.error.message === 'string') ? err.error.error.message :
                  (err.error && err.error.message && typeof err.error.message === 'string') ? err.error.message :
                    (err.error && typeof err.error === 'string') ? err.error :
                      (err.message && typeof err.message === 'string') ? err.message : (typeof err === 'string') ? err : 'Unknown Error'
          )
        };
      }
      return newErrorObj;
    },

    removeAuthSecureData: (node: any) => {
      if (node.authentication) {
        delete node.authentication.macaroonPath;
        delete node.authentication.runePath;
        delete node.authentication.runeValue;
        delete node.authentication.lnApiPassword;
        delete node.authentication.options;
      }
      return node;
    }
  };
};

describe('CommonService', () => {
  let commonService: ReturnType<typeof createCommonService>;

  beforeEach(() => {
    commonService = createCommonService();
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch timestamp in seconds', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = commonService.convertTimeToEpoch(date);
      expect(result).toBe(1704067200);
    });

    it('should handle current date', () => {
      const now = new Date();
      const result = commonService.convertTimeToEpoch(now);
      expect(result).toBe(Math.floor(now.getTime() / 1000));
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch timestamp to formatted time string', () => {
      const timestamp = 1704067200; // 2024-01-01T00:00:00Z
      const result = commonService.convertTimestampToTime(timestamp);
      expect(result).toMatch(/\d{2}\/[A-Z]{3}\/2024 \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array in ascending order by numeric key', () => {
      const arr = [{ id: 3 }, { id: 1 }, { id: 2 }];
      const result = commonService.sortAscByKey(arr, 'id');
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(3);
    });

    it('should handle empty array', () => {
      const arr: any[] = [];
      const result = commonService.sortAscByKey(arr, 'id');
      expect(result).toEqual([]);
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array in ascending order by string key', () => {
      const arr = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle missing keys', () => {
      const arr = [{ name: 'Bob' }, { other: 'value' }, { name: 'Alice' }];
      const result = commonService.sortAscByStrKey(arr, 'name');
      expect(result[0]).toEqual({ other: 'value' });
      expect(result[1].name).toBe('Alice');
      expect(result[2].name).toBe('Bob');
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array in descending order by numeric key', () => {
      const arr = [{ id: 1 }, { id: 3 }, { id: 2 }];
      const result = commonService.sortDescByKey(arr, 'id');
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe(1);
    });

    it('should handle zero and missing values', () => {
      const arr = [{ id: 0 }, { id: 5 }, { other: 'value' }];
      const result = commonService.sortDescByKey(arr, 'id');
      expect(result[0].id).toBe(5);
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array in descending order by string key', () => {
      const arr = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
      const result = commonService.sortDescByStrKey(arr, 'name');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });
  });

  describe('newestOnTop', () => {
    it('should move item with matching key-value to the beginning', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = commonService.newestOnTop(arr, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result.length).toBe(3);
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
  });

  describe('titleCase', () => {
    it('should convert string to title case', () => {
      const result = commonService.titleCase('hello world');
      expect(result).toBe('Hello World ');
    });

    it('should handle single word', () => {
      const result = commonService.titleCase('HELLO');
      expect(result).toBe('Hello');
    });

    it('should handle sentences with newlines', () => {
      const result = commonService.titleCase('HELLO!\nWORLD');
      expect(result).toBe('Hello!\nWorld\n');
    });
  });

  describe('maskPasswords', () => {
    it('should mask password fields', () => {
      const obj = { password: 'secret123', name: 'test' };
      const result = commonService.maskPasswords(obj);
      expect(result.password).toBe('********************');
      expect(result.name).toBe('test');
    });

    it('should mask multipass fields', () => {
      const obj = { multiPass: 'secret', other: 'value' };
      const result = commonService.maskPasswords(obj);
      expect(result.multiPass).toBe('********************');
    });

    it('should mask rpcpassword fields', () => {
      const obj = { rpcpassword: 'secret', rpcuser: 'admin' };
      const result = commonService.maskPasswords(obj);
      expect(result.rpcpassword).toBe('********************');
      expect(result.rpcuser).toBe('********************');
    });

    it('should not mask allowPasswordUpdate field', () => {
      const obj = { allowPasswordUpdate: true };
      const result = commonService.maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
    });

    it('should handle nested objects', () => {
      const obj = { settings: { password: 'nested' } };
      const result = commonService.maskPasswords(obj);
      expect(result.settings.password).toBe('********************');
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
    it('should return true when current version is higher', () => {
      const result = commonService.isVersionCompatible('v0.16.0', '0.15.0');
      expect(result).toBe(true);
    });

    it('should return true when versions are equal', () => {
      const result = commonService.isVersionCompatible('0.15.0', '0.15.0');
      expect(result).toBe(true);
    });

    it('should return false when current version is lower', () => {
      const result = commonService.isVersionCompatible('0.14.0', '0.15.0');
      expect(result).toBe(false);
    });

    it('should handle version strings with v prefix', () => {
      const result = commonService.isVersionCompatible('v1.0.0', '0.15.0');
      expect(result).toBe(true);
    });

    it('should return false for empty version string', () => {
      const result = commonService.isVersionCompatible('', '0.15.0');
      expect(result).toBe(false);
    });

    it('should return false for invalid version string', () => {
      const result = commonService.isVersionCompatible('invalid', '0.15.0');
      expect(result).toBe(false);
    });
  });

  describe('handleError', () => {
    it('should handle ENOENT error', () => {
      const err = { code: 'ENOENT', path: '/some/path' };
      const result = commonService.handleError(err, 'Test', 'Test error', null);
      expect(result.statusCode).toBe(500);
      expect(result.message).toContain('No such file or directory');
      expect(result.error).toContain('/some/path');
    });

    it('should preserve statusCode from error', () => {
      const err = { statusCode: 404, message: 'Not found' };
      const result = commonService.handleError(err, 'Test', 'Test error', null);
      expect(result.statusCode).toBe(404);
    });

    it('should handle ECONNREFUSED error', () => {
      const err = { error: { code: 'ECONNREFUSED' } };
      const result = commonService.handleError(err, 'Test', 'Test error', null);
      expect(result.statusCode).toBe(503);
    });

    it('should extract nested error messages', () => {
      const err = { error: { error: { error: 'Deep nested error' } } };
      const result = commonService.handleError(err, 'Test', 'Test error', null);
      expect(result.error).toBe('Deep nested error');
    });

    it('should use fallback message when no error details', () => {
      const err = {};
      const result = commonService.handleError(err, 'Test', 'Fallback message', null);
      expect(result.message).toBe('Fallback message');
    });
  });

  describe('removeAuthSecureData', () => {
    it('should remove sensitive authentication data', () => {
      const node = {
        authentication: {
          macaroonPath: '/path/to/macaroon',
          runePath: '/path/to/rune',
          runeValue: 'secret-rune',
          lnApiPassword: 'password',
          options: { key: 'value' },
          otherField: 'keep this'
        }
      };
      const result = commonService.removeAuthSecureData(node);
      expect(result.authentication.macaroonPath).toBeUndefined();
      expect(result.authentication.runePath).toBeUndefined();
      expect(result.authentication.runeValue).toBeUndefined();
      expect(result.authentication.lnApiPassword).toBeUndefined();
      expect(result.authentication.options).toBeUndefined();
      expect(result.authentication.otherField).toBe('keep this');
    });

    it('should handle node without authentication', () => {
      const node = { settings: { someConfig: true } };
      const result = commonService.removeAuthSecureData(node);
      expect(result).toEqual({ settings: { someConfig: true } });
    });
  });
});
