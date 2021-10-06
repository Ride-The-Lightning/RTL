"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const bodyParser = require("body-parser");
const shared_1 = require("../routes/shared");
const lnd_1 = require("../routes/lnd");
const c_lightning_1 = require("../routes/c-lightning");
const eclair_1 = require("../routes/eclair");
const common_1 = require("./common");
const logger_1 = require("./logger");
const logger = logger_1.Logger;
const app = express();
const common = common_1.Common;
const csrfProtection = csurf({ cookie: true });
const baseHref = '/rtl';
logger.log({ level: 'DEBUG', fileName: 'App', msg: 'Setting up Application Routes.' });
app.set('trust proxy', true);
app.use(cookieParser(common.secret_key));
app.use(bodyParser.json({ limit: '25mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '25mb' }));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, filePath');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    if (process.env.NODE_ENV === 'development') {
        res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '');
        return next();
    }
    csrfProtection(req, res, next);
});
app.use(baseHref + '/api', shared_1.default);
app.use(baseHref + '/api/lnd', lnd_1.default);
app.use(baseHref + '/api/cl', c_lightning_1.default);
app.use(baseHref + '/api/ecl', eclair_1.default);
app.use(baseHref, express.static(path.join(__dirname, '../..', 'angular')));
app.use((req, res, next) => {
    res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : '');
    res.sendFile(path.join(__dirname, '../..', 'angular', 'index.html'));
});
exports.default = app;
