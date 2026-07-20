import { Injectable } from '@angular/core';

/**
 * RFC 6238 TOTP (SHA1, 6 digits, 30 second step, window 0) implemented with
 * WebCrypto, replacing otplib in the browser bundle so the crypto-browserify
 * polyfill chain can be dropped. The backend still verifies login tokens with
 * otplib, so the parameters here must stay in sync with
 * server/controllers/shared/authenticate.ts (otplib authenticator defaults).
 */
@Injectable({ providedIn: 'root' })
export class TotpService {

  private base32Chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

  generateSecret(numberOfBytes: number = 10): string {
    const bytes = new Uint8Array(numberOfBytes);
    window.crypto.getRandomValues(bytes);
    return this.base32Encode(bytes);
  }

  keyuri(accountName: string, issuer: string, secret: string): string {
    return 'otpauth://totp/' + encodeURIComponent(issuer) + ':' + encodeURIComponent(accountName) +
      '?secret=' + secret + '&period=30&digits=6&algorithm=SHA1&issuer=' + encodeURIComponent(issuer);
  }

  check(token: string, secret: string, epochMs?: number): Promise<boolean> {
    if (!((/^\d+$/).test(token))) { return Promise.resolve(false); }
    return this.generate(secret, epochMs).then((expectedToken) => expectedToken === token).catch(() => false);
  }

  async generate(secret: string, epochMs?: number): Promise<string> {
    const counter = Math.floor((epochMs ?? Date.now()) / 30 / 1000);
    const counterBytes = new Uint8Array(8);
    let remaining = counter;
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = remaining & 0xff;
      remaining = Math.floor(remaining / 256);
    }
    const hmacKey = this.createHmacKey(this.base32Decode(secret));
    const cryptoKey = await window.crypto.subtle.importKey('raw', hmacKey, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);
    const digest = new Uint8Array(await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes));
    const offset = digest[digest.length - 1] & 0xf;
    const binary = ((digest[offset] & 0x7f) << 24) | ((digest[offset + 1] & 0xff) << 16) | ((digest[offset + 2] & 0xff) << 8) | (digest[offset + 3] & 0xff);
    return String(binary % (10 ** 6)).padStart(6, '0');
  }

  // Mirrors otplib's totpPadSecret for SHA1: secrets shorter than 10 bytes are
  // repeated up to 20 bytes. Never triggers for the 10 byte secrets generated
  // above; kept for exact parity with the backend's token derivation.
  private createHmacKey(secretBytes: Uint8Array): Uint8Array {
    if (secretBytes.length * 2 >= 20) { return secretBytes; }
    const padded = new Uint8Array(20);
    for (let i = 0; i < padded.length; i++) {
      padded[i] = secretBytes[i % secretBytes.length];
    }
    return padded;
  }

  private base32Encode(bytes: Uint8Array): string {
    let bits = 0;
    let value = 0;
    let encoded = '';
    for (const byte of bytes) {
      value = (value << 8) | byte;
      bits += 8;
      while (bits >= 5) {
        encoded += this.base32Chars[(value >>> (bits - 5)) & 31];
        bits -= 5;
      }
    }
    if (bits > 0) {
      encoded += this.base32Chars[(value << (5 - bits)) & 31];
    }
    return encoded;
  }

  private base32Decode(secret: string): Uint8Array {
    const normalized = secret.toUpperCase().replace(/[=]+$/, '');
    let bits = 0;
    let value = 0;
    const bytes: number[] = [];
    for (const char of normalized) {
      const index = this.base32Chars.indexOf(char);
      if (index < 0) { throw new Error('Invalid base32 character in secret.'); }
      value = (value << 5) | index;
      bits += 5;
      if (bits >= 8) {
        bytes.push((value >>> (bits - 8)) & 0xff);
        bits -= 8;
      }
    }
    return Uint8Array.from(bytes);
  }

}
