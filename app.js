const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const app = express();

//Declare all Routes here
const infoRoutes = require("./routes/getInfo");
const channelsRoutes = require("./routes/channels");
const peersRoutes = require("./routes/peers");
const feesRoutes = require("./routes/fees");
const balanceRoutes = require("./routes/balance");
const walletRoutes = require("./routes/wallet");
const graphRoutes = require("./routes/graph");
const newAddressRoutes = require("./routes/newAddress");
const transactionsRoutes = require("./routes/transactions");
const payReqRoutes = require("./routes/payReq");
const paymentsRoutes = require("./routes/payments");
const UISettingsRoutes = require("./routes/UISettings");
const LNDSettingsRoutes = require("./routes/lndConfSettings");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/", express.static(path.join(__dirname, "angular")));

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
app.use("/api/getinfo", infoRoutes);
app.use("/api/channels", channelsRoutes);
app.use("/api/peers", peersRoutes);
app.use("/api/fees", feesRoutes);
app.use("/api/balance", balanceRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/network", graphRoutes);
app.use("/api/newaddress", newAddressRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/payreq", payReqRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/uisettings", UISettingsRoutes);
app.use("/api/lndconf", LNDSettingsRoutes);

// sending angular application when route doesn't match
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
});

module.exports = app;
