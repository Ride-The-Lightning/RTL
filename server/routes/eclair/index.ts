import { Router } from 'express';
import infoECLRoutes from './getInfo';
import feesECLRoutes from './fees';
import channelsECLRoutes from './channels';
import onChainECLRoutes from './onchain';
import peersECLRoutes from './peers';
import invoicesECLRoutes from './invoices';
import paymentsECLRoutes from './payments';
import networkECLRoutes from './network';

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
