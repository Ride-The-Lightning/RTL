const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const common = require("./common");
const app = express();
const baseHref = "/rtl/";
const apiRoot = baseHref + "api/";
const apiLNDRoot = baseHref + "api/lnd/";
const apiCLRoot = baseHref + "api/cl/";

const authenticateRoutes = require("./routes/authenticate");
const RTLConfRoutes = require("./routes/RTLConf");
const infoRoutes = require("./routes/lnd/getInfo");
const channelsRoutes = require("./routes/lnd/channels");
const channelsBackupRoutes = require("./routes/lnd/channelsBackup");
const peersRoutes = require("./routes/lnd/peers");
const feesRoutes = require("./routes/lnd/fees");
const balanceRoutes = require("./routes/lnd/balance");
const walletRoutes = require("./routes/lnd/wallet");
const graphRoutes = require("./routes/lnd/graph");
const newAddressRoutes = require("./routes/lnd/newAddress");
const transactionsRoutes = require("./routes/lnd/transactions");
const payReqRoutes = require("./routes/lnd/payReq");
const paymentsRoutes = require("./routes/lnd/payments");
const invoiceRoutes = require("./routes/lnd/invoices");
const switchRoutes = require("./routes/lnd/switch");

const infoCLRoutes = require("./routes/c-lightning/getInfo");
const feesCLRoutes = require("./routes/c-lightning/fees");
const balanceCLRoutes = require("./routes/c-lightning/balance");
const channelsCLRoutes = require("./routes/c-lightning/channels");

app.use(cookieParser(common.secret_key));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(baseHref, express.static(path.join(__dirname, "angular")));

// CORS fix, Only required for developement due to separate backend and frontend servers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, filePath"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
});
// CORS fix, Only required for developement due to separate backend and frontend servers

app.use(apiRoot + "authenticate", authenticateRoutes);
app.use(apiRoot + "conf", RTLConfRoutes);
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

app.use(apiCLRoot + "getinfo", infoCLRoutes);
app.use(apiCLRoot + "fees", feesCLRoutes);
app.use(apiCLRoot + "balance", balanceCLRoutes);
app.use(apiCLRoot + "channels", channelsCLRoutes);

app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
});

module.exports = app;
