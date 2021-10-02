const express = require('express');
const router = express.Router();
const infoCLRoutes = require("./getInfo");
const feesCLRoutes = require("./fees");
const balanceCLRoutes = require("./balance");
const channelsCLRoutes = require("./channels");
const invoicesCLRoutes = require("./invoices");
const onChainCLRoutes = require("./onchain");
const paymentsCLRoutes = require("./payments");
const peersCLRoutes = require("./peers");
const networkCLRoutes = require("./network");
const messageCLRoutes = require("./message");

const clRoutes = [
  { path: '/getinfo', route: infoCLRoutes },
  { path: '/fees', route: feesCLRoutes },
  { path: '/balance', route: balanceCLRoutes },
  { path: '/channels', route: channelsCLRoutes },
  { path: '/invoices', route: invoicesCLRoutes },
  { path: '/onchain', route: onChainCLRoutes },
  { path: '/payments', route: paymentsCLRoutes },
  { path: '/peers', route: peersCLRoutes },
  { path: '/network', route: networkCLRoutes },
  { path: '/message', route: messageCLRoutes }
];

clRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
