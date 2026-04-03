/**
 * Tests for CommonService utility functions
 * Focus on pure functions that can be tested without mocking dependencies
 */

// Recreate the testable pure functions from CommonService
const MONTHS = [
  { name: 'JAN', days: 31 }, { name: 'FEB', days: 28 }, { name: 'MAR', days: 31 }, { name: 'APR', days: 30 }, { name: 'MAY', days: 31 }, { name: 'JUN', days: 30 },
  { name: 'JUL', days: 31 }, { name: 'AUG', days: 31 }, { name: 'SEP', days: 30 }, { name: 'OCT', days: 31 }, { name: 'NOV', days: 30 }, { name: 'DEC', days: 31 }
];

const maskPasswords = (obj: any): any => {
  const keys = Object.keys(obj);
  const length = keys.length;
  if (length !== 0) {
    for (let i = 0; i < length; i++) {
      if (typeof obj[keys[i]] === 'object' && obj[keys[i]] !== null) {
        keys[keys[i] as any] = maskPasswords(obj[keys[i]]);
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
};

const convertTimeToEpoch = (timeToConvert: Date): number => Math.floor(timeToConvert.getTime() / 1000);

const convertTimestampToTime = (num: number): string => {
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
};

const sortAscByKey = (array: any[], key: string): any[] => array.sort((a, b) => {
  const x = +a[key];
  const y = +b[key];
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
});

const sortAscByStrKey = (array: any[], key: string): any[] => array.sort((a, b) => {
  const x = a[key] ? a[key].toUpperCase() : '';
  const y = b[key] ? b[key].toUpperCase() : '';
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
});

const sortDescByKey = (array: any[], key: string): any[] => {
  const temp = array.sort((a, b) => {
    const x = +a[key] ? +a[key] : 0;
    const y = +b[key] ? +b[key] : 0;
    return (x > y) ? -1 : ((x < y) ? 1 : 0);
  });
  return temp;
};

const sortDescByStrKey = (array: any[], key: string): any[] => {
  const temp = array.sort((a, b) => {
    const x = a[key] ? a[key].toUpperCase() : '';
    const y = b[key] ? b[key].toUpperCase() : '';
    return (x > y) ? -1 : ((x < y) ? 1 : 0);
  });
  return temp;
};

const newestOnTop = (array: any[], key: string, value: any): any[] => {
  const newlyAddedRecord = array.splice(array.findIndex((item) => item[key] === value), 1);
  array?.unshift(newlyAddedRecord[0]);
  return array;
};

const camelCase = (str: string): string => str?.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => (word.toUpperCase()))?.replace(/\s+/g, '')?.replace(/-/g, ' ');

const titleCase = (str: string): string => {
  if (str.indexOf('!\n') > 0 || str.indexOf('.\n') > 0) {
    return str.split('\n')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + '\n', '');
  } else {
    if (str.indexOf(' ') > 0) {
      return str.split(' ')?.reduce((accumulator, currentStr) => accumulator + currentStr.charAt(0).toUpperCase() + currentStr.substring(1).toLowerCase() + ' ', '');
    } else {
      return str.charAt(0).toUpperCase() + str.substring(1).toLowerCase();
    }
  }
};

const getMonthDays = (selMonth: number, selYear: number): number => ((selMonth === 1 && selYear % 4 === 0) ? (MONTHS[selMonth].days + 1) : MONTHS[selMonth].days);

const isVersionCompatible = (currentVersion: string, checkVersion: string): boolean => {
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
};

const getRequestIP = (req: any): string | null => ((typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) ||
  req.ip ||
  req.connection?.remoteAddress ||
  req.socket?.remoteAddress ||
  (req.connection?.socket ? req.connection.socket.remoteAddress : null));

describe('CommonService', () => {
  describe('maskPasswords', () => {
    it('should mask password fields', () => {
      const obj = { password: 'secret123', username: 'admin' };
      const result = maskPasswords(obj);
      expect(result.password).toBe('********************');
      expect(result.username).toBe('admin');
    });

    it('should mask multipass fields', () => {
      const obj = { multiPass: 'mysecret', name: 'test' };
      const result = maskPasswords(obj);
      expect(result.multiPass).toBe('********************');
      expect(result.name).toBe('test');
    });

    it('should mask rpcpass fields', () => {
      const obj = { rpcpass: 'rpcpassword', rpcport: 8080 };
      const result = maskPasswords(obj);
      expect(result.rpcpass).toBe('********************');
      expect(result.rpcport).toBe(8080);
    });

    it('should mask rpcpassword fields', () => {
      const obj = { rpcpassword: 'secret', server: 'localhost' };
      const result = maskPasswords(obj);
      expect(result.rpcpassword).toBe('********************');
      expect(result.server).toBe('localhost');
    });

    it('should mask rpcuser fields', () => {
      const obj = { rpcuser: 'admin', host: '127.0.0.1' };
      const result = maskPasswords(obj);
      expect(result.rpcuser).toBe('********************');
      expect(result.host).toBe('127.0.0.1');
    });

    it('should NOT mask allowPasswordUpdate field', () => {
      const obj = { allowPasswordUpdate: true, password: 'secret' };
      const result = maskPasswords(obj);
      expect(result.allowPasswordUpdate).toBe(true);
      expect(result.password).toBe('********************');
    });

    it('should recursively mask nested objects', () => {
      const obj = { 
        config: { password: 'nested_secret' },
        name: 'test'
      };
      const result = maskPasswords(obj);
      expect(result.config.password).toBe('********************');
      expect(result.name).toBe('test');
    });

    it('should handle empty objects', () => {
      const obj = {};
      const result = maskPasswords(obj);
      expect(result).toEqual({});
    });
  });

  describe('convertTimeToEpoch', () => {
    it('should convert Date to epoch seconds', () => {
      const date = new Date('2024-01-01T00:00:00Z');
      const result = convertTimeToEpoch(date);
      expect(result).toBe(1704067200);
    });

    it('should handle current date', () => {
      const now = new Date();
      const result = convertTimeToEpoch(now);
      expect(result).toBe(Math.floor(now.getTime() / 1000));
    });
  });

  describe('convertTimestampToTime', () => {
    it('should convert epoch to formatted time string', () => {
      // Use a fixed timestamp and check the format
      const timestamp = 1704067200; // 2024-01-01T00:00:00Z
      const result = convertTimestampToTime(timestamp);
      // Result depends on timezone, so just check format
      expect(result).toMatch(/^\d{2}\/[A-Z]{3}\/\d{4} \d{2}:\d{2}:\d{2}$/);
    });

    it('should pad single-digit values with leading zeros', () => {
      const timestamp = 1704067200;
      const result = convertTimestampToTime(timestamp);
      // All time components should be two digits
      const parts = result.split(' ');
      expect(parts[1]).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('sortAscByKey', () => {
    it('should sort array ascending by numeric key', () => {
      const arr = [{ value: 30 }, { value: 10 }, { value: 20 }];
      const result = sortAscByKey(arr, 'value');
      expect(result[0].value).toBe(10);
      expect(result[1].value).toBe(20);
      expect(result[2].value).toBe(30);
    });

    it('should handle string numbers', () => {
      const arr = [{ amount: '300' }, { amount: '100' }, { amount: '200' }];
      const result = sortAscByKey(arr, 'amount');
      expect(result[0].amount).toBe('100');
      expect(result[1].amount).toBe('200');
      expect(result[2].amount).toBe('300');
    });

    it('should handle empty array', () => {
      const arr: any[] = [];
      const result = sortAscByKey(arr, 'value');
      expect(result).toEqual([]);
    });
  });

  describe('sortAscByStrKey', () => {
    it('should sort array ascending by string key (case-insensitive)', () => {
      const arr = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'bob' }];
      const result = sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBe('Alice');
      expect(result[1].name).toBe('bob');
      expect(result[2].name).toBe('Charlie');
    });

    it('should handle undefined values', () => {
      const arr = [{ name: 'Bob' }, { name: undefined }, { name: 'Alice' }];
      const result = sortAscByStrKey(arr, 'name');
      expect(result[0].name).toBeUndefined();
      expect(result[1].name).toBe('Alice');
      expect(result[2].name).toBe('Bob');
    });
  });

  describe('sortDescByKey', () => {
    it('should sort array descending by numeric key', () => {
      const arr = [{ value: 10 }, { value: 30 }, { value: 20 }];
      const result = sortDescByKey(arr, 'value');
      expect(result[0].value).toBe(30);
      expect(result[1].value).toBe(20);
      expect(result[2].value).toBe(10);
    });

    it('should handle zero and falsy values', () => {
      const arr = [{ value: 0 }, { value: 100 }, { value: null }];
      const result = sortDescByKey(arr, 'value');
      expect(result[0].value).toBe(100);
      // 0 and null both become 0
    });
  });

  describe('sortDescByStrKey', () => {
    it('should sort array descending by string key (case-insensitive)', () => {
      const arr = [{ name: 'Alice' }, { name: 'Charlie' }, { name: 'Bob' }];
      const result = sortDescByStrKey(arr, 'name');
      expect(result[0].name).toBe('Charlie');
      expect(result[1].name).toBe('Bob');
      expect(result[2].name).toBe('Alice');
    });
  });

  describe('newestOnTop', () => {
    it('should move matching item to top of array', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = newestOnTop(arr, 'id', 3);
      expect(result[0].id).toBe(3);
      expect(result[1].id).toBe(1);
      expect(result[2].id).toBe(2);
    });

    it('should handle item already at top', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = newestOnTop(arr, 'id', 1);
      expect(result[0].id).toBe(1);
    });
  });

  describe('camelCase', () => {
    it('should convert string to camel case with uppercase', () => {
      const result = camelCase('hello world');
      expect(result).toBe('HelloWorld');
    });

    it('should handle dashes by replacing with spaces', () => {
      const result = camelCase('hello-world');
      expect(result).toBe('Hello World');
    });

    it('should handle undefined/null', () => {
      expect(camelCase(undefined as any)).toBeUndefined();
    });
  });

  describe('titleCase', () => {
    it('should convert string to title case', () => {
      const result = titleCase('hello');
      expect(result).toBe('Hello');
    });

    it('should handle multiple words', () => {
      const result = titleCase('hello world');
      expect(result).toBe('Hello World ');
    });

    it('should handle strings with newlines after exclamation', () => {
      const result = titleCase('HELLO!\nWORLD');
      expect(result).toBe('Hello!\nWorld\n');
    });

    it('should handle strings with newlines after period', () => {
      const result = titleCase('HELLO.\nWORLD');
      expect(result).toBe('Hello.\nWorld\n');
    });

    it('should handle all uppercase', () => {
      const result = titleCase('HELLO WORLD');
      expect(result).toBe('Hello World ');
    });
  });

  describe('getMonthDays', () => {
    it('should return 31 for January (month 0)', () => {
      expect(getMonthDays(0, 2024)).toBe(31);
    });

    it('should return 28 for February in non-leap year', () => {
      expect(getMonthDays(1, 2023)).toBe(28);
    });

    it('should return 29 for February in leap year', () => {
      expect(getMonthDays(1, 2024)).toBe(29);
    });

    it('should return 30 for April (month 3)', () => {
      expect(getMonthDays(3, 2024)).toBe(30);
    });

    it('should return 31 for December (month 11)', () => {
      expect(getMonthDays(11, 2024)).toBe(31);
    });
  });

  describe('isVersionCompatible', () => {
    it('should return true when current version is greater (major)', () => {
      expect(isVersionCompatible('2.0.0', '1.0.0')).toBe(true);
    });

    it('should return true when current version is greater (minor)', () => {
      expect(isVersionCompatible('1.5.0', '1.2.0')).toBe(true);
    });

    it('should return true when current version is greater (patch)', () => {
      expect(isVersionCompatible('1.2.5', '1.2.3')).toBe(true);
    });

    it('should return true when versions are equal', () => {
      expect(isVersionCompatible('1.2.3', '1.2.3')).toBe(true);
    });

    it('should return false when current version is lower', () => {
      expect(isVersionCompatible('1.0.0', '2.0.0')).toBe(false);
    });

    it('should handle version with v prefix', () => {
      expect(isVersionCompatible('v2.0.0', '1.0.0')).toBe(true);
    });

    it('should return false for empty version', () => {
      expect(isVersionCompatible('', '1.0.0')).toBe(false);
    });

    it('should return false for invalid version string', () => {
      expect(isVersionCompatible('invalid', '1.0.0')).toBe(false);
    });

    it('should handle versions with additional suffixes', () => {
      expect(isVersionCompatible('v0.15.8-beta', '0.15.0')).toBe(true);
    });
  });

  describe('getRequestIP', () => {
    it('should return x-forwarded-for header when present', () => {
      const req = {
        headers: { 'x-forwarded-for': '192.168.1.1, 10.0.0.1' },
        ip: '127.0.0.1'
      };
      expect(getRequestIP(req)).toBe('192.168.1.1');
    });

    it('should return req.ip when no x-forwarded-for', () => {
      const req = {
        headers: {},
        ip: '192.168.1.100'
      };
      expect(getRequestIP(req)).toBe('192.168.1.100');
    });

    it('should return connection.remoteAddress as fallback', () => {
      const req = {
        headers: {},
        ip: undefined,
        connection: { remoteAddress: '10.0.0.5' }
      };
      expect(getRequestIP(req)).toBe('10.0.0.5');
    });

    it('should return socket.remoteAddress as fallback', () => {
      const req = {
        headers: {},
        ip: undefined,
        connection: {},
        socket: { remoteAddress: '10.0.0.10' }
      };
      expect(getRequestIP(req)).toBe('10.0.0.10');
    });

    it('should return connection.socket.remoteAddress as last fallback', () => {
      const req = {
        headers: {},
        ip: undefined,
        connection: { socket: { remoteAddress: '10.0.0.15' } },
        socket: {}
      };
      expect(getRequestIP(req)).toBe('10.0.0.15');
    });

    it('should return null when no IP source available', () => {
      const req = {
        headers: {},
        ip: undefined,
        connection: {},
        socket: {}
      };
      expect(getRequestIP(req)).toBeNull();
    });
  });
});
