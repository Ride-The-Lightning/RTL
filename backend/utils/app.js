"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors_1 = require("./cors");
const csrf_1 = require("./csrf");
const shared_1 = require("../routes/shared");
const lnd_1 = require("../routes/lnd");
const c_lightning_1 = require("../routes/c-lightning");
const eclair_1 = require("../routes/eclair");
const common_1 = require("./common");
const logger_1 = require("./logger");
const config_1 = require("./config");
const WebSocketServer = require("./webSocketServer");
class ExpressApplication {
    constructor() {
        this.app = express();
        this.logger = logger_1.Logger;
        this.common = common_1.Common;
        this.config = config_1.Config;
        this.baseHref = '/rtl';
        this.getApp = () => this.app;
        this.loadConfiguration = () => {
            this.config.setServerConfiguration();
        };
        this.loadDatabase = () => {
            this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'LOAD DATABASE: IN PROGRESS' });
        };
        this.setCORS = () => { cors_1.default.mount(this.app); };
        this.setCSRF = () => { csrf_1.default.mount(this.app); };
        this.setApplicationRoutes = () => {
            this.logger.log({ level: 'DEBUG', fileName: 'App', msg: 'Setting up Application Routes.' });
            this.app.use(this.baseHref + '/api', shared_1.default);
            this.app.use(this.baseHref + '/api/lnd', lnd_1.default);
            this.app.use(this.baseHref + '/api/cl', c_lightning_1.default);
            this.app.use(this.baseHref + '/api/ecl', eclair_1.default);
            this.app.use(this.baseHref, express.static(path.join(__dirname, '../..', 'angular')));
            this.app.use((req, res, next) => {
                res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : '');
                res.sendFile(path.join(__dirname, '../..', 'angular', 'index.html'));
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
        this.app = WebSocketServer.plugIn(this.app);
        this.setApplicationRoutes();
    }
}
exports.App = new ExpressApplication();
