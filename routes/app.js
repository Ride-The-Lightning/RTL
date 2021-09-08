const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const csurf = require("csurf");
const common = require("./common");

const baseHref = "/rtl/";
const apiRoot = baseHref + "api/";
const apiLNDRoot = baseHref + "api/lnd/";
const apiCLRoot = baseHref + "api/cl/";
const apiECLRoot = baseHref + "api/ecl/";

const authenticateRoutes = require("./shared/authenticate");
const RTLConfRoutes = require("./shared/RTLConf");
const loopRoutes = require('./shared/loop');
const boltzRoutes = require('./shared/boltz');

const infoRoutes = require("./lnd/getInfo");
const channelsRoutes = require("./lnd/channels");
const channelsBackupRoutes = require("./lnd/channelsBackup");
const peersRoutes = require("./lnd/peers");
const feesRoutes = require("./lnd/fees");
const balanceRoutes = require("./lnd/balance");
const walletRoutes = require("./lnd/wallet");
const graphRoutes = require("./lnd/graph");
const newAddressRoutes = require("./lnd/newAddress");
const transactionsRoutes = require("./lnd/transactions");
const payReqRoutes = require("./lnd/payReq");
const paymentsRoutes = require("./lnd/payments");
const invoiceRoutes = require("./lnd/invoices");
const switchRoutes = require("./lnd/switch");
const messageRoutes = require("./lnd/message");

const infoCLRoutes = require("./c-lightning/getInfo");
const feesCLRoutes = require("./c-lightning/fees");
const balanceCLRoutes = require("./c-lightning/balance");
const channelsCLRoutes = require("./c-lightning/channels");
const invoicesCLRoutes = require("./c-lightning/invoices");
const onChainCLRoutes = require("./c-lightning/onchain");
const paymentsCLRoutes = require("./c-lightning/payments");
const peersCLRoutes = require("./c-lightning/peers");
const networkCLRoutes = require("./c-lightning/network");
const messageCLRoutes = require("./c-lightning/message");

const infoECLRoutes = require("./eclair/getInfo");
const feesECLRoutes = require("./eclair/fees");
const channelsECLRoutes = require("./eclair/channels");
const onChainECLRoutes = require("./eclair/onchain");
const peersECLRoutes = require("./eclair/peers");
const invoicesECLRoutes = require("./eclair/invoices");
const paymentsECLRoutes = require("./eclair/payments");
const networkECLRoutes = require("./eclair/network");

const app = express();
const csrfProtection = csurf({cookie: true});

app.set('trust proxy', true);
app.use(cookieParser(common.secret_key));
app.use(bodyParser.json({limit: '25mb'}));
app.use(bodyParser.urlencoded({extended: false, limit: '25mb'}));
app.use(baseHref, express.static(path.join(__dirname, "..", "angular")));

app.use((req, res, next) => {
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, filePath"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  if (process.env.NODE_ENV == 'development') {
  	res.setHeader("Access-Control-Allow-Origin", req.headers.origin ? req.headers.origin : '');
    return next(); 
  }
  csrfProtection(req, res, next);
});

app.use(apiRoot + "authenticate", authenticateRoutes);
app.use(apiRoot + "conf", RTLConfRoutes);
app.use(apiRoot + "boltz", boltzRoutes);

app.use(apiLNDRoot + "getinfo", infoRoutes);
app.use(apiLNDRoot + "channels", channelsRoutes);
app.use(apiLNDRoot + "channels/backup", channelsBackupRoutes);
app.use(apiLNDRoot + "peers", peersRoutes);
app.use(apiLNDRoot + "fees", feesRoutes);
app.use(apiLNDRoot + "balance", balanceRoutes);
app.use(apiLNDRoot + "wallet", walletRoutes);
app.use(apiLNDRoot + "network", graphRoutes);
app.use(apiLNDRoot + "newaddress", newAddressRoutes);
app.use(apiLNDRoot + "transactions", transactionsRoutes);
app.use(apiLNDRoot + "payreq", payReqRoutes);
app.use(apiLNDRoot + "payments", paymentsRoutes);
app.use(apiLNDRoot + "invoices", invoiceRoutes);
app.use(apiLNDRoot + "switch", switchRoutes);
app.use(apiLNDRoot + "loop", loopRoutes);
app.use(apiLNDRoot + "message", messageRoutes);

require('../controllers/c-lightning/db.init') //initiating database for clightning offers
app.use(apiCLRoot + "getinfo", infoCLRoutes);
app.use(apiCLRoot + "fees", feesCLRoutes);
app.use(apiCLRoot + "balance", balanceCLRoutes);
app.use(apiCLRoot + "channels", channelsCLRoutes);
app.use(apiCLRoot + "invoices", invoicesCLRoutes);
app.use(apiCLRoot + "onchain", onChainCLRoutes);
app.use(apiCLRoot + "payments", paymentsCLRoutes);
app.use(apiCLRoot + "peers", peersCLRoutes);
app.use(apiCLRoot + "network", networkCLRoutes);
app.use(apiCLRoot + "message", messageCLRoutes);

app.use(apiECLRoot + "getinfo", infoECLRoutes);
app.use(apiECLRoot + "fees", feesECLRoutes);
app.use(apiECLRoot + "channels", channelsECLRoutes);
app.use(apiECLRoot + "onchain", onChainECLRoutes);
app.use(apiECLRoot + "peers", peersECLRoutes);
app.use(apiECLRoot + "invoices", invoicesECLRoutes);
app.use(apiECLRoot + "payments", paymentsECLRoutes);
app.use(apiECLRoot + "network", networkECLRoutes);

app.use((req, res, next) => {
  res.cookie('XSRF-TOKEN', req.csrfToken ? req.csrfToken() : '');
  res.sendFile(path.join(__dirname, "..", "angular", "index.html"));
});

module.exports = app;
