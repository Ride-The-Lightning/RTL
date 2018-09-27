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
const graphInfoRoutes = require("./routes/graphInfo");
const newAddressRoutes = require("./routes/newAddress");
const transactionsRoutes = require("./routes/transactions");
const UISettingsRoutes = require("./routes/UISettings");

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use("/", express.static(path.join(__dirname, "angular")));

// CORS fix, Only required for developement due to separate backend and frontend servers
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
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
app.use("/api/network", graphInfoRoutes);
app.use("/api/newaddress", newAddressRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/uisettings", UISettingsRoutes);

// sending angular application when route doesn't match
app.use((req, res, next) => {
  res.sendFile(path.join(__dirname, "angular", "index.html"));
});

module.exports = app;
