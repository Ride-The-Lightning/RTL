import * as express from 'express';
import * as path from 'path';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import * as bodyParser from 'body-parser';

import sharedRoutes from '../routes/shared';
import lndRoutes from '../routes/lnd';
import clRoutes from '../routes/c-lightning';
import eclRoutes from '../routes/eclair';
import { Common, CommonService } from './common';
import { Logger, LoggerService } from './logger';

const logger: LoggerService = Logger;
const app = express();
const common: CommonService = Common;
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

app.use(baseHref + '/api', sharedRoutes);
app.use(baseHref + '/api/lnd', lndRoutes);
app.use(baseHref + '/api/cl', clRoutes);
app.use(baseHref + '/api/ecl', eclRoutes);
app.use(baseHref, express.static(path.join(__dirname, '../..', 'angular')));

app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : '');
  res.sendFile(path.join(__dirname, '../..', 'angular', 'index.html'));
});

export default app;
