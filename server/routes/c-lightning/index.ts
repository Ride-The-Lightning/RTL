import { Router } from 'express';
import infoCLRoutes from './getInfo';
import feesCLRoutes from './fees';
import balanceCLRoutes from './balance';
import channelsCLRoutes from './channels';
import invoicesCLRoutes from './invoices';
import onChainCLRoutes from './onchain';
import paymentsCLRoutes from './payments';
import peersCLRoutes from './peers';
import networkCLRoutes from './network';
import messageCLRoutes from './message';

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
  { path: '/message', route: messageCLRoutes }
];

clRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
