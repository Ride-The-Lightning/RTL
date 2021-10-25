import exprs from 'express';
const { Router } = exprs;
import infoCLRoutes from './getInfo.js';
import feesCLRoutes from './fees.js';
import balanceCLRoutes from './balance.js';
import channelsCLRoutes from './channels.js';
import invoicesCLRoutes from './invoices.js';
import onChainCLRoutes from './onchain.js';
import paymentsCLRoutes from './payments.js';
import peersCLRoutes from './peers.js';
import networkCLRoutes from './network.js';
import messageCLRoutes from './message.js';
import offerCLRoutes from './offer.js';

const router = Router();

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
  { path: '/message', route: messageCLRoutes },
  { path: '/offers', route: offerCLRoutes }
];

clRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
