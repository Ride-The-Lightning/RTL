import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Common } from './common.js';
const common = Common;
// The session cookie's maxAge (app.ts) is also one day, but its day restarts whenever the
// session changes. A token's day starts at login and it is not renewed, so it ends at most one
// day after the login, even for a user who is active then.
export const SESSION_TOKEN_LIFETIME_SECONDS = 24 * 60 * 60;
// Every token this process issued and has not ended, by its id (jti), with the session it was
// issued to. Like secret_key it lives in memory only, so a restart ends every token as before.
// expiresAt only lets forgetExpired() prune the map; the JWT's exp is what refuses an expired token.
const issuedTokens = new Map();
const forgetExpired = () => {
    const now = Date.now();
    issuedTokens.forEach((issued, tokenId) => {
        if (issued.expiresAt <= now) {
            issuedTokens.delete(tokenId);
        }
    });
};
export const issueSessionToken = (sessionId, user) => {
    forgetExpired();
    const tokenId = crypto.randomUUID();
    issuedTokens.set(tokenId, { sessionId: sessionId, expiresAt: Date.now() + (SESSION_TOKEN_LIFETIME_SECONDS * 1000) });
    return jwt.sign({ user: user }, common.secret_key, { jwtid: tokenId, expiresIn: SESSION_TOKEN_LIFETIME_SECONDS });
};
// True only for a token this process issued to this session, which has not expired and has
// not been ended by a logout or a password change.
export const isSessionTokenFor = (token, sessionId) => {
    if (typeof token !== 'string' || token === '' || typeof sessionId !== 'string' || sessionId === '') {
        return false;
    }
    try {
        const payload = jwt.verify(token, common.secret_key);
        const issued = payload && typeof payload.jti === 'string' ? issuedTokens.get(payload.jti) : null;
        return !!issued && issued.sessionId === sessionId;
    }
    catch (error) {
        return false;
    }
};
// Ends every token issued to this session.
export const endSessionTokens = (sessionId) => {
    issuedTokens.forEach((issued, tokenId) => {
        if (issued.sessionId === sessionId) {
            issuedTokens.delete(tokenId);
        }
    });
};
// Ends every token, of every session.
export const endAllSessionTokens = () => {
    issuedTokens.clear();
};
