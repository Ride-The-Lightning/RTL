import { TestBed } from '@angular/core/testing';

import { TotpService } from './totp.service';

describe('TotpService', () => {
  let service: TotpService;
  // RFC 6238 appendix B secret ("12345678901234567890" ascii) in base32.
  const rfcSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [TotpService] });
    service = TestBed.inject(TotpService);
  });

  it('should generate RFC 6238 SHA1 test-vector tokens (matching otplib)', async () => {
    // 6-digit truncations of the appendix B vectors; verified identical to
    // otplib.authenticator.generate() at the same epochs.
    expect(await service.generate(rfcSecret, 59000)).toBe('287082');
    expect(await service.generate(rfcSecret, 1111111109000)).toBe('081804');
    expect(await service.generate(rfcSecret, 1234567890000)).toBe('005924');
    expect(await service.generate(rfcSecret, 2000000000000)).toBe('279037');
  });

  it('should check tokens against the same epoch window', async () => {
    expect(await service.check('287082', rfcSecret, 59000)).toBe(true);
    expect(await service.check('287082', rfcSecret, 2000000000000)).toBe(false);
    expect(await service.check('123456', rfcSecret, 59000)).toBe(false);
    expect(await service.check('28708a', rfcSecret, 59000)).toBe(false);
    expect(await service.check('', rfcSecret, 59000)).toBe(false);
  });

  it('should reject an invalid base32 secret instead of throwing', async () => {
    expect(await service.check('287082', 'not!base32', 59000)).toBe(false);
  });

  it('should generate 16 character base32 secrets', () => {
    const secret = service.generateSecret();
    expect(secret.length).toBe(16);
    expect(secret).toMatch(/^[A-Z2-7]+$/);
    expect(service.generateSecret()).not.toBe(secret);
  });

  it('should build the same keyuri as otplib.authenticator.keyuri', () => {
    // Exact output of authenticator.keyuri('', 'Ride The Lightning (RTL)', secret).
    expect(service.keyuri('', 'Ride The Lightning (RTL)', rfcSecret)).toBe(
      'otpauth://totp/Ride%20The%20Lightning%20(RTL):?secret=' + rfcSecret +
      '&period=30&digits=6&algorithm=SHA1&issuer=Ride%20The%20Lightning%20(RTL)'
    );
  });
});
