import { doubleCsrf } from 'csrf-csrf';
import { Logger } from './logger.js';
import { Common } from './common.js';
class CSRF {
    constructor() {
        this.logger = Logger;
        this.common = Common;
        // Signed double-submit-cookie protection (replaces the deprecated csurf).
        // The signed token lives in the httpOnly '_csrf' cookie; the client echoes
        // the same token (read from the XSRF-TOKEN cookie set in app.ts) in a
        // header. The cookie is not secure-only because RTL commonly serves plain
        // HTTP (matching the session cookie); token sources match what csurf
        // accepted. The error code EBADCSRFTOKEN is handled in app.ts.
        this.doubleCsrfUtilities = doubleCsrf({
            getSecret: () => this.common.secret_key,
            getSessionIdentifier: (req) => (req.session ? req.session.id : ''),
            cookieName: '_csrf',
            cookieOptions: { sameSite: 'strict', path: '/', secure: false, httpOnly: true },
            getCsrfTokenFromRequest: (req) => (req.body && req.body._csrf) || (req.query && req.query._csrf) ||
                req.headers['csrf-token'] || req.headers['xsrf-token'] ||
                req.headers['x-csrf-token'] || req.headers['x-xsrf-token']
        });
        this.csrfProtection = this.doubleCsrfUtilities.doubleCsrfProtection;
        // Force-mints a fresh token for the current session, discarding any token
        // cookie bound to a previous session or boot secret (used by the
        // EBADCSRFTOKEN error path in app.ts so a client retry succeeds).
        this.reMintToken = (req, res) => this.doubleCsrfUtilities.generateCsrfToken(req, res, { overwrite: true });
    }
    mount(app) {
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'CSRF', msg: 'Setting up CSRF..' });
        if (process.env.NODE_ENV !== 'development') {
            app.use((req, res, next) => this.csrfProtection(req, res, next));
        }
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'CSRF', msg: 'CSRF Set' });
        return app;
    }
    ;
}
export default new CSRF;
