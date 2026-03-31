import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getFailedInfo, verifyToken } from '../authenticate.js';
import { Common } from '../../../utils/common.js';

describe('authenticate controller', () => {
  describe('getFailedInfo', () => {
    it('should create new failed info for first attempt', () => {
      const currentTime = Date.now();
      const reqIP = '192.168.1.100';
      const result = getFailedInfo(reqIP, currentTime);
      expect(result.count).toBe(0);
      expect(result.lastTried).toBe(currentTime);
    });

    it('should return existing failed info for same IP', () => {
      const currentTime = Date.now();
      const reqIP = '192.168.1.101';
      // First call
      const first = getFailedInfo(reqIP, currentTime);
      first.count = 3;
      // Second call with same IP should return same object
      const second = getFailedInfo(reqIP, currentTime + 1000);
      expect(second.count).toBe(3);
    });

    it('should return existing failed info for different IPs independently', () => {
      const currentTime = Date.now();
      const reqIP1 = '192.168.1.201';
      const reqIP2 = '192.168.1.202';
      
      // First IP
      const first = getFailedInfo(reqIP1, currentTime);
      first.count = 3;
      
      // Second IP should have independent tracking
      const second = getFailedInfo(reqIP2, currentTime);
      expect(second.count).toBe(0);
      expect(first.count).toBe(3);
    });
  });

  describe('verifyToken', () => {
    beforeEach(() => {
      // Reset appConfig
      Common.appConfig.secret2FA = '';
    });

    afterEach(() => {
      Common.appConfig.secret2FA = '';
    });

    it('should return false when no secret2FA is configured', () => {
      Common.appConfig.secret2FA = '';
      const result = verifyToken('123456');
      expect(result).toBe(false);
    });

    it('should return false when secret2FA is empty string', () => {
      Common.appConfig.secret2FA = '';
      const result = verifyToken('123456');
      expect(result).toBe(false);
    });

    it('should return false for invalid token with valid secret', () => {
      // Set a valid base32 secret
      Common.appConfig.secret2FA = 'JBSWY3DPEHPK3PXP';
      const result = verifyToken('000000');
      expect(result).toBe(false);
    });
  });
});
