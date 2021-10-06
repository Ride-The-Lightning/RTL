import { Router } from 'express';
import infoRoutes from './getInfo';
import channelsRoutes from './channels';
import channelsBackupRoutes from './channelsBackup';
import peersRoutes from './peers';
import feesRoutes from './fees';
import balanceRoutes from './balance';
import walletRoutes from './wallet';
import graphRoutes from './graph';
import newAddressRoutes from './newAddress';
import transactionsRoutes from './transactions';
import payReqRoutes from './payReq';
import paymentsRoutes from './payments';
import invoiceRoutes from './invoices';
import switchRoutes from './switch';
import messageRoutes from './message';

const router = Router();

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

export default router;
