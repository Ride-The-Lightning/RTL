import * as exprs from 'express';
const { Router } = exprs;
import infoECLRoutes from './getInfo.js';
import feesECLRoutes from './fees.js';
import channelsECLRoutes from './channels.js';
import onChainECLRoutes from './onchain.js';
import peersECLRoutes from './peers.js';
import invoicesECLRoutes from './invoices.js';
import paymentsECLRoutes from './payments.js';
import networkECLRoutes from './network.js';

const router = Router();

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

export default router;
