import { __awaiter } from "tslib";
import express from 'express';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import CORS from './cors.js';
import CSRF from './csrf.js';
import sharedRoutes from '../routes/shared/index.js';
import lndRoutes from '../routes/lnd/index.js';
import clRoutes from '../routes/c-lightning/index.js';
import eclRoutes from '../routes/eclair/index.js';
import { Common } from './common.js';
import { Logger } from './logger.js';
import { Config } from './config.js';
export class ExpressApplication {
    constructor() {
        this.app = express();
        this.logger = Logger;
        this.common = Common;
        this.config = Config;
        this.directoryName = dirname(fileURLToPath(import.meta.url));
        this.getApp = () => this.app;
        this.loadConfiguration = () => {
            this.config.setServerConfiguration();
        };
        this.loadDatabase = () => __awaiter(this, void 0, void 0, function* () {
            this.logger.log({ level: 'INFO', fileName: 'App', msg: 'LOAD DATABASE: IN PROGRESS' });
        });
        this.setCORS = () => { CORS.mount(this.app); };
        this.setCSRF = () => { CSRF.mount(this.app); };
        this.setApplicationRoutes = () => {
            this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'Setting up Application Routes.' });
            this.app.use(this.common.baseHref + '/api', sharedRoutes);
            this.app.use(this.common.baseHref + '/api/lnd', lndRoutes);
            this.app.use(this.common.baseHref + '/api/cl', clRoutes);
            this.app.use(this.common.baseHref + '/api/ecl', eclRoutes);
            this.app.use(this.common.baseHref, express.static(join(this.directoryName, '../..', 'angular')));
            this.app.use((req, res, next) => {
                res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : '');
                res.sendFile(join(this.directoryName, '../..', 'angular', 'index.html'));
            });
            this.app.use((err, req, res, next) => this.handleApplicationErrors(err, res));
        };
        this.handleApplicationErrors = (err, res) => {
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
        this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'Starting Express Application.' });
        this.app.set('trust proxy', true);
        this.app.use(cookieParser(this.common.secret_key));
        this.app.use(bodyParser.json({ limit: '25mb' }));
        this.app.use(bodyParser.urlencoded({ extended: false, limit: '25mb' }));
        this.loadConfiguration();
        this.loadDatabase();
        this.setCORS();
        this.setCSRF();
        this.setApplicationRoutes();
    }
}
export default ExpressApplication;