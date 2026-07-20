import { doubleCsrf } from 'csrf-csrf';
import { Application } from 'express';
import { Logger, LoggerService } from './logger.js';
import { Common, CommonService } from './common.js';

class CSRF {

  public logger: LoggerService = Logger;
  public common: CommonService = Common;

  // Signed double-submit-cookie protection (replaces the deprecated csurf).
  // The signed token lives in the httpOnly '_csrf' cookie; the client echoes
  // the same token (read from the XSRF-TOKEN cookie set in app.ts) in a
  // header. The cookie is not secure-only because RTL commonly serves plain
  // HTTP (matching the session cookie); token sources match what csurf
  // accepted. The error code EBADCSRFTOKEN is handled in app.ts.
  private doubleCsrfUtilities = doubleCsrf({
    getSecret: () => this.common.secret_key,
    getSessionIdentifier: (req: any) => (req.session ? req.session.id : ''),
    cookieName: '_csrf',
    cookieOptions: { sameSite: 'strict', path: '/', secure: false, httpOnly: true },
    getCsrfTokenFromRequest: (req: any) => (req.body && req.body._csrf) || (req.query && req.query._csrf) ||
      req.headers['csrf-token'] || req.headers['xsrf-token'] ||
      req.headers['x-csrf-token'] || req.headers['x-xsrf-token']
  });

  public csrfProtection = this.doubleCsrfUtilities.doubleCsrfProtection;

  public mount(app: Application): Application {
    this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'CSRF', msg: 'Setting up CSRF..' });
    if (process.env.NODE_ENV !== 'development') {
      app.use((req, res, next) => this.csrfProtection(req, res, next));
    }
    this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'CSRF', msg: 'CSRF Set' });
    return app;
  };

}

export default new CSRF;
