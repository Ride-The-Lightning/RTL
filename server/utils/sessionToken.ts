import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Common, CommonService } from './common.js';

const common: CommonService = Common;

// Same lifetime as the session cookie (app.ts).
export const SESSION_TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;

// Every token this process issued and has not ended, by its id (jti), with the session it was
// issued to. Like secret_key it lives in memory only, so a restart ends every token as before.
const issuedTokens = new Map<string, { sessionId: string, expiresAt: number }>();

const forgetExpired = () => {
  const now = Date.now();
  issuedTokens.forEach((issued, tokenId) => {
    if (issued.expiresAt <= now) { issuedTokens.delete(tokenId); }
  });
};

export const issueSessionToken = (sessionId: string, user: string) => {
  forgetExpired();
  const tokenId = crypto.randomUUID();
  issuedTokens.set(tokenId, { sessionId: sessionId, expiresAt: Date.now() + (SESSION_TOKEN_LIFETIME_SECONDS * 1000) });
  return jwt.sign({ user: user }, common.secret_key, { jwtid: tokenId, expiresIn: SESSION_TOKEN_LIFETIME_SECONDS });
};

// True only for a token this process issued to this session, which has not expired and has
// not been ended by a logout or a password change.
export const isSessionTokenFor = (token, sessionId) => {
  if (typeof token !== 'string' || token === '' || typeof sessionId !== 'string' || sessionId === '') { return false; }
  try {
    const payload: any = jwt.verify(token, common.secret_key);
    const issued = payload && typeof payload.jti === 'string' ? issuedTokens.get(payload.jti) : null;
    return !!issued && issued.sessionId === sessionId;
  } catch (error) {
    return false;
  }
};

// Ends every token issued to this session.
export const endSessionTokens = (sessionId: string) => {
  issuedTokens.forEach((issued, tokenId) => {
    if (issued.sessionId === sessionId) { issuedTokens.delete(tokenId); }
  });
};

// Ends every token, of every session.
export const endAllSessionTokens = () => {
  issuedTokens.clear();
};
