const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const common = require("./common");
const app = express();

//Declare all Routes here
const authenticateRoutes = require("./routes/authenticate");
const infoRoutes = require("./routes/getInfo");
const channelsRoutes = require("./routes/channels");
const channelsBackupRoutes = require("./routes/channelsBackup");
const peersRoutes = require("./routes/peers");
const feesRoutes = require("./routes/fees");
const balanceRoutes = require("./routes/balance");
const walletRoutes = require("./routes/wallet");
const graphRoutes = require("./routes/graph");
const newAddressRoutes = require("./routes/newAddress");
const transactionsRoutes = require("./routes/transactions");
const payReqRoutes = require("./routes/payReq");
const paymentsRoutes = require("./routes/payments");
const RTLConfRoutes = require("./routes/RTLConf");
const invoiceRoutes = require("./routes/invoices");
const switchRoutes = require("./routes/switch");
const baseHref = "/rtl/";
const apiRoot = baseHref + "api/";

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

// Use declared routes here
app.use(apiRoot + "authenticate", authenticateRoutes);
app.use(apiRoot + "getinfo", infoRoutes);
app.use(apiRoot + "channels", channelsRoutes);
app.use(apiRoot + "channels/backup", channelsBackupRoutes);
app.use(apiRoot + "peers", peersRoutes);
app.use(apiRoot + "fees", feesRoutes);
app.use(apiRoot + "balance", balanceRoutes);
app.use(apiRoot + "wallet", walletRoutes);
app.use(apiRoot + "network", graphRoutes);
app.use(apiRoot + "newaddress", newAddressRoutes);
app.use(apiRoot + "transactions", transactionsRoutes);
app.use(apiRoot + "payreq", payReqRoutes);
app.use(apiRoot + "payments", paymentsRoutes);
app.use(apiRoot + "conf", RTLConfRoutes);
app.use(apiRoot + "invoices", invoiceRoutes);
app.use(apiRoot + "switch", switchRoutes);

// sending angular application when route doesn't match
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
});

module.exports = app;
