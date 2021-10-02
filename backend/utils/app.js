const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const csurf = require('csurf');
const common = require('./common');

const baseHref = '/rtl/';
const sharedRoutes = require('../routes/shared');
const lndRoutes = require('../routes/lnd');
const clRoutes = require('../routes/c-lightning');
const eclRoutes = require('../routes/eclair');

const app = express();
const csrfProtection = csurf({cookie: true});

app.set('trust proxy', true);
app.use(cookieParser(common.secret_key));
app.use(bodyParser.json({limit: '25mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '25mb'}));
app.use(baseHref, express.static(path.join(__dirname, '../..', 'angular')));

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, filePath');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  if (process.env.NODE_ENV === 'development') {
  	res.setHeader('Access-Control-Allow-Origin', req.headers.origin ? req.headers.origin : '');
    return next(); 
  }
  csrfProtection(req, res, next);
});

app.use(baseHref + 'api/', sharedRoutes);
app.use(baseHref + 'api/lnd/', lndRoutes);
app.use(baseHref + 'api/cl/', clRoutes);
app.use(baseHref + 'api/ecl/', eclRoutes);

app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : '');
  res.sendFile(path.join(__dirname, '../..', 'angular', 'index.html'));
});

module.exports = app;
