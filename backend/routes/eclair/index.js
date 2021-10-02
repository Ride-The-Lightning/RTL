const express = require('express');
const router = express.Router();
const infoECLRoutes = require("./getInfo");
const feesECLRoutes = require("./fees");
const channelsECLRoutes = require("./channels");
const onChainECLRoutes = require("./onchain");
const peersECLRoutes = require("./peers");
const invoicesECLRoutes = require("./invoices");
const paymentsECLRoutes = require("./payments");
const networkECLRoutes = require("./network");


const eclRoutes = [
  { path: '/getinfo', route: infoECLRoutes },
  { path: '/fees', route: feesECLRoutes },
  { path: '/channels', route: channelsECLRoutes },
  { path: '/onchain', route: onChainECLRoutes },
  { path: '/peers', route: peersECLRoutes },
  { path: '/invoices', route: invoicesECLRoutes },
  { path: '/payments', route: paymentsECLRoutes },
  { path: '/network', route: networkECLRoutes }
];

eclRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

module.exports = router;
