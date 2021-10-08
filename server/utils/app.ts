import * as express from 'express';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

import CORS from './cors';
import CSRF from './csrf';

import sharedRoutes from '../routes/shared';
import lndRoutes from '../routes/lnd';
import clRoutes from '../routes/c-lightning';
import eclRoutes from '../routes/eclair';
import { Common, CommonService } from './common';
import { Logger, LoggerService } from './logger';
import { Config, ConfigService } from './config';
import * as WebSocketServer from './webSocketServer';

class ExpressApplication {

  public app = express();
  public logger: LoggerService = Logger;
  public common: CommonService = Common;
  public config: ConfigService = Config;
  public baseHref = '/rtl';

  constructor() {
    this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'Starting Express Application.' });

    this.app.set('trust proxy', true);
    this.app.use(cookieParser(this.common.secret_key));
    this.app.use(bodyParser.json({ limit: '25mb' }));
    this.app.use(bodyParser.urlencoded({ extended: false, limit: '25mb' }));

    this.loadConfiguration();
    this.loadDatabase();
    this.setCORS();
    this.setCSRF();
    this.app = WebSocketServer.plugIn(this.app);
    this.setApplicationRoutes();
  }

  public getApp = () => this.app;

  public loadConfiguration = () => {
    this.config.setServerConfiguration();
  }

  public loadDatabase = () => {
    this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'LOAD DATABASE: IN PROGRESS' });
  }

  public setCORS = () => { CORS.mount(this.app); }

  public setCSRF = () => { CSRF.mount(this.app); }

  public setApplicationRoutes = () => {
    this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'Setting up Application Routes.' });

    this.app.use(this.baseHref + '/api', sharedRoutes);
    this.app.use(this.baseHref + '/api/lnd', lndRoutes);
    this.app.use(this.baseHref + '/api/cl', clRoutes);
    this.app.use(this.baseHref + '/api/ecl', eclRoutes);
    this.app.use(this.baseHref, express.static(path.join(__dirname, '../..', 'angular')));
    this.app.use((req, res, next) => {
      res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : '');
      res.sendFile(path.join(__dirname, '../..', 'angular', 'index.html'));
    });
    this.app.use((err, req, res, next) => this.handleApplicationErrors(err, res));
  }

  public handleApplicationErrors = (err, res) => {
    switch (err.code) {
      case 'EACCES':
        this.logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'Server requires elevated privileges' });
        res.status(406).send('Server requires elevated privileges.');
        break;
      case 'EADDRINUSE':
        this.logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'Server is already in use' });
        res.status(409).send('Server is already in use.');
        break;
      case 'ECONNREFUSED':
        this.logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'Server is down/locked' });
        res.status(401).send('Server is down/locked.');
        break;
      case 'EBADCSRFTOKEN':
        this.logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'Invalid CSRF token. Form tempered.' });
        res.status(403).send('Invalid CSRF token, form tempered.');
        break;
      default:
        this.logger.log({ level: 'ERROR', fileName: 'RTL', msg: 'DEFUALT ERROR', error: err.code });
        res.status(400).send(JSON.stringify(err));
        break;
    }
  };

}

export const App = new ExpressApplication();
