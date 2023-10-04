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
import { Common } from './common.js';
import { Logger } from './logger.js';
import { CLWSClient } from '../controllers/cln/webSocketClient.js';
import { ECLWSClient } from '../controllers/eclair/webSocketClient.js';
import { LNDWSClient } from '../controllers/lnd/webSocketClient.js';
const ONE_DAY = 1000 * 60 * 60 * 24;
export class ExpressApplication {
    constructor() {
        this.app = express();
        this.logger = Logger;
        this.common = Common;
        this.eclWsClient = ECLWSClient;
        this.clWsClient = CLWSClient;
        this.lndWsClient = LNDWSClient;
        this.directoryName = dirname(fileURLToPath(import.meta.url));
        this.getApp = () => this.app;
        this.setCORS = () => { CORS.mount(this.app); };
        this.setCSRF = () => { CSRF.mount(this.app); };
        this.setApplicationRoutes = () => {
            this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'App', msg: 'Setting up Application Routes..' });
            this.app.use(this.common.baseHref + '/api', sharedRoutes);
            this.app.use(this.common.baseHref + '/api/lnd', lndRoutes);
            this.app.use(this.common.baseHref + '/api/cln', clnRoutes);
            this.app.use(this.common.baseHref + '/api/ecl', eclRoutes);
            this.app.use(this.common.baseHref, express.static(join(this.directoryName, '../..', 'frontend')));
            this.app.use((req, res, next) => {
                res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : (req.cookies && req.cookies._csrf) ? req.cookies._csrf : ''); // RTL Angular Frontend
                res.setHeader('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : (req.cookies && req.cookies._csrf) ? req.cookies._csrf : ''); // RTL Quickpay JQuery
                res.sendFile(join(this.directoryName, '../..', 'frontend', 'index.html'));
            });
            this.app.use((err, req, res, next) => {
                this.handleApplicationErrors(err, res);
                next();
            });
            this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'App', msg: 'Application Routes Set' });
        };
        this.handleApplicationErrors = (err, res) => {
            switch (err.code) {
                case 'EACCES':
                    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'App', msg: 'Server requires elevated privileges' });
                    res.status(406).send('Server requires elevated privileges.');
                    break;
                case 'EADDRINUSE':
                    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'App', msg: 'Server is already in use' });
                    res.status(409).send('Server is already in use.');
                    break;
                case 'ECONNREFUSED':
                    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'App', msg: 'Server is down/locked' });
                    res.status(401).send('Server is down/locked.');
                    break;
                case 'EBADCSRFTOKEN':
                    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'App', msg: 'Invalid CSRF token. Form tempered.' });
                    res.status(403).send('Invalid CSRF token, form tempered.');
                    break;
                default:
                    this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'ERROR', fileName: 'App', msg: 'DEFUALT ERROR', error: err });
                    res.status(400).send(JSON.stringify(err));
                    break;
            }
        };
        this.logger.log({ selectedNode: this.common.initSelectedNode, level: 'INFO', fileName: 'App', msg: 'Starting Express Application..' });
        this.app.set('trust proxy', true);
        this.app.use(sessions({ secret: this.common.secret_key, saveUninitialized: true, cookie: { secure: false, maxAge: ONE_DAY }, resave: false }));
        this.app.use(cookieParser(this.common.secret_key));
        this.app.use(bodyParser.json({ limit: '25mb' }));
        this.app.use(bodyParser.urlencoded({ extended: false, limit: '25mb' }));
        this.setCORS();
        this.setCSRF();
        this.setApplicationRoutes();
    }
}
export default ExpressApplication;
