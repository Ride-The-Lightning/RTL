const express = require('express');
const router = express.Router();
const infoRoutes = require("./getInfo");
const channelsRoutes = require("./channels");
const channelsBackupRoutes = require("./channelsBackup");
const peersRoutes = require("./peers");
const feesRoutes = require("./fees");
const balanceRoutes = require("./balance");
const walletRoutes = require("./wallet");
const graphRoutes = require("./graph");
const newAddressRoutes = require("./newAddress");
const transactionsRoutes = require("./transactions");
const payReqRoutes = require("./payReq");
const paymentsRoutes = require("./payments");
const invoiceRoutes = require("./invoices");
const switchRoutes = require("./switch");
const messageRoutes = require("./message");

const lndRoutes = [
  { path: '/getinfo', route: infoRoutes },
  { path: '/channels', route: channelsRoutes },
  { path: '/channels/backup', route: channelsBackupRoutes },
  { path: '/peers', route: peersRoutes },
  { path: '/fees', route: feesRoutes },
  { path: '/balance', route: balanceRoutes },
  { path: '/wallet', route: walletRoutes },
  { path: '/network', route: graphRoutes },
  { path: '/newaddress', route: newAddressRoutes },
  { path: '/transactions', route: transactionsRoutes },
  { path: '/payreq', route: payReqRoutes },
  { path: '/payments', route: paymentsRoutes },
  { path: '/invoices', route: invoiceRoutes },
  { path: '/switch', route: switchRoutes },
  { path: '/message', route: messageRoutes }
];

lndRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
