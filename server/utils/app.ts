import express from 'express';
import sessions from 'express-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { join, dirname, posix } from 'path';
import { fileURLToPath } from 'url';
import CORS from './cors.js';
import CSRF from './csrf.js';

import sharedRoutes from '../routes/shared/index.js';
import lndRoutes from '../routes/lnd/index.js';
import clnRoutes from '../routes/cln/index.js';
import eclRoutes from '../routes/eclair/index.js';
import { Database, DatabaseService } from './database.js';
import { Common, CommonService } from './common.js';
import { Logger, LoggerService } from './logger.js';
import { CLWSClient, CLWebSocketClient } from '../controllers/cln/webSocketClient.js';
import { ECLWSClient, ECLWebSocketClient } from '../controllers/eclair/webSocketClient.js';
import { LNDWSClient, LNDWebSocketClient } from '../controllers/lnd/webSocketClient.js';

const ONE_DAY = 1000 * 60 * 60 * 24;

export class ExpressApplication {

  public app = express();
  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public eclWsClient: ECLWebSocketClient = ECLWSClient;
  // public clWsClient: CLWebSocketClient = CLWSClient;
  public lndWsClient: LNDWebSocketClient = LNDWSClient;
  public databaseService: DatabaseService = Database;
  public directoryName = dirname(fileURLToPath(import.meta.url));

  constructor() {
    this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'App', msg: 'Starting Express Application..' });
    // Only the configured proxies may speak for the client: with none, req.ip is the socket
    // peer. Trusting every hop (the previous `true`) let any client rotate X-Forwarded-For
    // to dodge the login lockout (issue #1656). express compiles the list here, so a
    // malformed entry fails at startup rather than on the first request. The setting also
    // governs req.protocol/req.secure/req.hostname/req.ips, none of which server/ reads;
    // both cookies (session, CSRF) are secure:false, so nothing else changes behind TLS.
    try {
      this.app.set('trust proxy', this.common.trustedProxies ? this.common.trustedProxies : false);
    } catch (err) {
      this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'Invalid trustedProxies value "' + this.common.trustedProxies + '": ' + err.message });
      throw err;
    }
    const overBroad = this.common.overBroadTrustedProxies(this.common.trustedProxies);
    if (overBroad.length > 0) {
      // Logged at ERROR: the only level the logger prints before a node's log is selected.
      const msg = 'Configuration warning: trustedProxies entries "' + overBroad.join('", "') + '" cover more than one host. ' +
        'Every client whose address is inside a trusted entry can forge its own address and defeat the login lockout; list the proxy\'s exact address instead';
      this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: msg });
    }
    this.app.use(sessions({ secret: this.common.secret_key, saveUninitialized: true, cookie: { secure: false, maxAge: ONE_DAY }, resave: false }));
    this.app.use(cookieParser(this.common.secret_key));
    this.app.use(bodyParser.json({ limit: '25mb' }));
    this.app.use(bodyParser.urlencoded({ extended: false, limit: '25mb' }));

    this.setCORS();
    this.setCSRF();
    this.setApplicationRoutes();
    this.databaseService.migrateDatabase();
  }

  public getApp = () => this.app;

  public setCORS = () => { CORS.mount(this.app); };

  public setCSRF = () => { CSRF.mount(this.app); };

  public setApplicationRoutes = () => {
    this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'App', msg: 'Setting up Application Routes..' });
    this.app.use(this.common.baseHref + '/api', sharedRoutes);
    this.app.use(this.common.baseHref + '/api/lnd', lndRoutes);
    this.app.use(this.common.baseHref + '/api/cln', clnRoutes);
    this.app.use(this.common.baseHref + '/api/ecl', eclRoutes);
    // index: false leaves the directory index (GET baseHref/) to the catch-all below. Served
    // by express.static it went out without the XSRF-TOKEN cookie, which only the catch-all
    // mints, so a visitor entering at /rtl/ failed their first POST with 403 (issue #1710).
    // The index file stays reachable as a plain file through any spelling that send's
    // decode + normalize collapses back to it (//index.html, /./index.html, %2e, %69…),
    // each the same tokenless entry; send every such spelling to the directory index so
    // there is one entry path. The redirect keeps the query string.
    this.app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') { next(); return; }
      const queryAt = req.url.indexOf('?');
      let pathname;
      try {
        pathname = posix.normalize(decodeURIComponent(queryAt === -1 ? req.url : req.url.slice(0, queryAt)).replace(/\\/g, '/'));
      } catch {
        next(); return; // not decodable: static falls through too, so the catch-all answers it
      }
      if (pathname.replace(/\/+$/, '').toLowerCase() === (this.common.baseHref + '/index.html').toLowerCase()) {
        // A new session's cookie rides on this 301 and it reflects the query string;
        // a redirect is heuristically cacheable, so forbid storing it.
        res.set('Cache-Control', 'no-store');
        res.redirect(301, this.common.baseHref + '/' + (queryAt === -1 ? '' : req.url.slice(queryAt)));
        return;
      }
      next();
    });
    this.app.use(this.common.baseHref, express.static(join(this.directoryName, '../..', 'frontend'), { index: false }));
    this.app.use((req: any, res, next) => {
      // Generate the token once per request: with csrf-csrf every call mints a
      // new token on a first visit, so calling twice would desync the cookie
      // from the header and the _csrf cookie it must match.
      const csrfToken = req.csrfToken ? req.csrfToken() : (req.cookies && req.cookies._csrf) ? req.cookies._csrf : '';
      res.cookie('XSRF-TOKEN', csrfToken); // RTL Angular Frontend
      // The response carries a per-client token pair. Every response already gets
      // no-cache from cors.ts, which still lets a shared cache store the pair subject
      // to revalidation; no-store forbids storing it at all.
      res.set('Cache-Control', 'no-store');
      res.sendFile(join(this.directoryName, '../..', 'frontend', 'index.html'));
    });
    this.app.use((err, req, res, next) => {
      this.handleApplicationErrors(err, req, res);
      next();
    });
    this.logger.log({ selectedNode: this.common.selectedNode, level: 'INFO', fileName: 'App', msg: 'Application Routes Set' });
  };

  public handleApplicationErrors = (err, req, res) => {
    switch (err.code) {
      case 'EACCES':
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'Server requires elevated privileges' });
        res.status(406).send('Server requires elevated privileges.');
        break;
      case 'EADDRINUSE':
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'Server is already in use' });
        res.status(409).send('Server is already in use.');
        break;
      case 'ECONNREFUSED':
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'Server is down/locked' });
        res.status(401).send('Server is down/locked.');
        break;
      case 'EBADCSRFTOKEN':
        // Re-mint the token for the current session so a client retry succeeds
        // (the stale one may be bound to a destroyed session or rotated secret).
        try {
          const csrfToken = CSRF.reMintToken(req, res);
          res.cookie('XSRF-TOKEN', csrfToken);
        } catch (csrfError) {
          this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'CSRF Token Re-Mint Failed', error: csrfError });
        }
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'Invalid CSRF token. Form tempered.' });
        res.set('Cache-Control', 'no-store'); // carries the re-minted token pair
        res.status(403).send('Invalid CSRF token, form tempered.');
        break;
      default:
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'DEFUALT ERROR', error: err });
        res.status(400).send(JSON.stringify(err));
        break;
    }
  };

}

export default ExpressApplication;
