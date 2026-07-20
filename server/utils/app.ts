import express from 'express';
import sessions from 'express-session';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { join, dirname } from 'path';
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
    this.app.set('trust proxy', true);
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
    this.app.use(this.common.baseHref, express.static(join(this.directoryName, '../..', 'frontend')));
    this.app.use((req: any, res, next) => {
      // Generate the token once per request: with csrf-csrf every call mints a
      // new token on a first visit, so calling twice would desync the cookie
      // from the header and the _csrf cookie it must match.
      const csrfToken = req.csrfToken ? req.csrfToken() : (req.cookies && req.cookies._csrf) ? req.cookies._csrf : '';
      res.cookie('XSRF-TOKEN', csrfToken); // RTL Angular Frontend
      res.setHeader('XSRF-TOKEN', csrfToken); // RTL Quickpay JQuery
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
          res.setHeader('XSRF-TOKEN', csrfToken);
        } catch (csrfError) {
          this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'CSRF Token Re-Mint Failed', error: csrfError });
        }
        this.logger.log({ selectedNode: this.common.selectedNode, level: 'ERROR', fileName: 'App', msg: 'Invalid CSRF token. Form tempered.' });
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
