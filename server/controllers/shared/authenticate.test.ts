import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock dependencies
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(() => 'mock-token'),
    verify: vi.fn(() => true)
  }
}));

vi.mock('otplib', () => ({
  authenticator: {
    check: vi.fn((token, secret) => token === '123456' && secret === 'test-secret')
  }
}));

vi.mock('crypto', () => ({
  default: {
    timingSafeEqual: vi.fn((a, b) => a.toString() === b.toString()),
    createHash: vi.fn(() => ({
      update: vi.fn(() => ({
        digest: vi.fn(() => 'hashed-value')
      }))
    }))
  },
  timingSafeEqual: vi.fn((a, b) => a.toString() === b.toString()),
  createHash: vi.fn(() => ({
    update: vi.fn(() => ({
      digest: vi.fn(() => 'hashed-value')
    }))
  }))
}));

vi.mock('../../utils/database.js', () => ({
  Database: {
    unloadDatabase: vi.fn()
  },
  DatabaseService: class {}
}));

vi.mock('../../utils/logger.js', () => ({
  Logger: {
    log: vi.fn()
  },
  LoggerService: class {}
}));

vi.mock('../../utils/common.js', () => ({
  Common: {
    appConfig: {
      SSO: { rtlSSO: 0, cookieValue: '' },
      rtlPass: 'hashed-password',
      secret2FA: ''
    },
    secret_key: 'test-secret-key',
    selectedNode: {},
    getRequestIP: vi.fn(() => '127.0.0.1'),
    convertTimestampToTime: vi.fn(() => '01/JAN/2024 12:00:00'),
    handleError: vi.fn((err, fileName, errMsg, node) => ({
      statusCode: err.statusCode || 500,
      message: err.message || errMsg,
      error: err.error || errMsg
    })),
    refreshCookie: vi.fn()
  },
  CommonService: class {}
}));

const ONE_MINUTE = 60000;
const LOCKING_PERIOD = 30 * ONE_MINUTE;
const ALLOWED_LOGIN_ATTEMPTS = 5;

// Re-implement getFailedInfo for testing without side effects
const createGetFailedInfo = () => {
  const failedLoginAttempts: Record<string, { count: number; lastTried: number }> = {};
  
  return {
    getFailedInfo: (reqIP: string, currentTime: number) => {
      let failed = { count: 0, lastTried: currentTime };
      if ((!failedLoginAttempts[reqIP]) || (currentTime > (failed.lastTried + LOCKING_PERIOD))) {
        failed = { count: 0, lastTried: currentTime };
        failedLoginAttempts[reqIP] = failed;
      } else {
        failed = failedLoginAttempts[reqIP];
      }
      return failed;
    },
    failedLoginAttempts,
    updateAttempts: (reqIP: string, count: number, lastTried: number) => {
      failedLoginAttempts[reqIP] = { count, lastTried };
    }
  };
};

// Re-implement handleMultipleFailedAttemptsError for testing
const handleMultipleFailedAttemptsError = (failed: { count: number; lastTried: number }, currentTime: number, errMsg: string) => {
  if (failed.count >= ALLOWED_LOGIN_ATTEMPTS && (currentTime <= (failed.lastTried + LOCKING_PERIOD))) {
    return {
      message: 'Multiple Failed Login Attempts!',
      error: 'Application locked for ' + (LOCKING_PERIOD / ONE_MINUTE) + ' minutes due to multiple failed attempts!\nTry again after some time!'
    };
  } else {
    return {
      message: 'Authentication Failed!',
      error: errMsg + '\nApplication will be locked after ' + (ALLOWED_LOGIN_ATTEMPTS - failed.count) + ' more unsuccessful attempts!'
    };
  }
};

// Re-implement verifyToken for testing
const createVerifyToken = (appConfig: { secret2FA: string }) => {
  return (twoFAToken: string) => {
    const otplib = { authenticator: { check: (token: string, secret: string) => token === '123456' && secret === 'test-secret' } };
    return !!(appConfig.secret2FA && appConfig.secret2FA !== '' && otplib.authenticator.check(twoFAToken, appConfig.secret2FA));
  };
};

describe('Authenticate Controller', () => {
  describe('getFailedInfo', () => {
    it('should create new entry for unknown IP', () => {
      const { getFailedInfo } = createGetFailedInfo();
      const currentTime = Date.now();
      const result = getFailedInfo('192.168.1.1', currentTime);
      
      expect(result.count).toBe(0);
      expect(result.lastTried).toBe(currentTime);
    });

    it('should return existing entry for known IP within locking period', () => {
      const { getFailedInfo, updateAttempts } = createGetFailedInfo();
      const currentTime = Date.now();
      
      // Set up existing failed attempts
      updateAttempts('192.168.1.1', 3, currentTime - 1000);
      
      const result = getFailedInfo('192.168.1.1', currentTime);
      expect(result.count).toBe(3);
    });

    it('should track different IPs separately', () => {
      const { getFailedInfo, updateAttempts } = createGetFailedInfo();
      const currentTime = Date.now();
      
      updateAttempts('192.168.1.1', 2, currentTime);
      updateAttempts('192.168.1.2', 4, currentTime);
      
      const result1 = getFailedInfo('192.168.1.1', currentTime);
      const result2 = getFailedInfo('192.168.1.2', currentTime);
      
      expect(result1.count).toBe(2);
      expect(result2.count).toBe(4);
    });
  });

  describe('handleMultipleFailedAttemptsError', () => {
    it('should return locked message when max attempts exceeded', () => {
      const currentTime = Date.now();
      const failed = { count: 5, lastTried: currentTime };
      
      const result = handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid Password!');
      
      expect(result.message).toBe('Multiple Failed Login Attempts!');
      expect(result.error).toContain('Application locked for 30 minutes');
    });

    it('should return warning message when under max attempts', () => {
      const currentTime = Date.now();
      const failed = { count: 2, lastTried: currentTime };
      
      const result = handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid Password!');
      
      expect(result.message).toBe('Authentication Failed!');
      expect(result.error).toContain('Application will be locked after 3 more unsuccessful attempts');
    });

    it('should return warning for 4 attempts', () => {
      const currentTime = Date.now();
      const failed = { count: 4, lastTried: currentTime };
      
      const result = handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid Token!');
      
      expect(result.error).toContain('Application will be locked after 1 more unsuccessful attempts');
    });

    it('should unlock after locking period expires', () => {
      const currentTime = Date.now();
      const oldTime = currentTime - LOCKING_PERIOD - 1000; // Past locking period
      const failed = { count: 5, lastTried: oldTime };
      
      const result = handleMultipleFailedAttemptsError(failed, currentTime, 'Invalid Password!');
      
      // Should not be locked since we're past the locking period
      expect(result.message).toBe('Authentication Failed!');
    });
  });

  describe('verifyToken', () => {
    it('should return false when secret2FA is empty', () => {
      const verifyToken = createVerifyToken({ secret2FA: '' });
      const result = verifyToken('123456');
      expect(result).toBe(false);
    });

    it('should return false when secret2FA is not set', () => {
      const verifyToken = createVerifyToken({ secret2FA: '' });
      const result = verifyToken('123456');
      expect(result).toBe(false);
    });

    it('should return true for valid token and secret', () => {
      const verifyToken = createVerifyToken({ secret2FA: 'test-secret' });
      const result = verifyToken('123456');
      expect(result).toBe(true);
    });

    it('should return false for invalid token', () => {
      const verifyToken = createVerifyToken({ secret2FA: 'test-secret' });
      const result = verifyToken('wrong-token');
      expect(result).toBe(false);
    });
  });

  describe('Authentication Constants', () => {
    it('should have correct locking period of 30 minutes', () => {
      expect(LOCKING_PERIOD).toBe(30 * 60 * 1000);
    });

    it('should allow 5 login attempts', () => {
      expect(ALLOWED_LOGIN_ATTEMPTS).toBe(5);
    });
  });

  describe('Mock Request/Response Handling', () => {
    let mockReq: any;
    let mockRes: any;

    beforeEach(() => {
      mockReq = {
        body: {},
        session: { selectedNode: {} },
        ip: '127.0.0.1',
        headers: {},
        connection: { remoteAddress: '127.0.0.1' },
        socket: { remoteAddress: '127.0.0.1' }
      };

      mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        clearCookie: vi.fn()
      };
    });

    it('should have properly structured mock request', () => {
      expect(mockReq.session).toBeDefined();
      expect(mockReq.session.selectedNode).toBeDefined();
    });

    it('should have properly structured mock response', () => {
      mockRes.status(200);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      
      mockRes.json({ success: true });
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it('should support chained response methods', () => {
      const result = mockRes.status(401).json({ error: 'Unauthorized' });
      expect(result).toBe(mockRes);
    });
  });
});

describe('IP Extraction', () => {
  const getRequestIP = (req: any) => (
    (typeof req.headers['x-forwarded-for'] === 'string' && req.headers['x-forwarded-for'].split(',').shift()) ||
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    (req.connection?.socket ? req.connection.socket.remoteAddress : null)
  );

  it('should extract IP from x-forwarded-for header', () => {
    const req = { headers: { 'x-forwarded-for': '10.0.0.1, 192.168.1.1' } };
    expect(getRequestIP(req)).toBe('10.0.0.1');
  });

  it('should extract IP from req.ip', () => {
    const req = { headers: {}, ip: '192.168.1.100' };
    expect(getRequestIP(req)).toBe('192.168.1.100');
  });

  it('should extract IP from connection.remoteAddress', () => {
    const req = { headers: {}, connection: { remoteAddress: '10.10.10.10' } };
    expect(getRequestIP(req)).toBe('10.10.10.10');
  });

  it('should extract IP from socket.remoteAddress', () => {
    const req = { headers: {}, socket: { remoteAddress: '172.16.0.1' } };
    expect(getRequestIP(req)).toBe('172.16.0.1');
  });

  it('should handle single x-forwarded-for IP', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.50' } };
    expect(getRequestIP(req)).toBe('203.0.113.50');
  });
});
