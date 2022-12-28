import exprs from 'express';
const { Router } = exprs;
import infoRoutes from './getInfo.js';
import channelsRoutes from './channels.js';
import channelsBackupRoutes from './channelsBackup.js';
import peersRoutes from './peers.js';
import feesRoutes from './fees.js';
import balanceRoutes from './balance.js';
import walletRoutes from './wallet.js';
import graphRoutes from './graph.js';
import newAddressRoutes from './newAddress.js';
import transactionsRoutes from './transactions.js';
import paymentsRoutes from './payments.js';
import invoiceRoutes from './invoices.js';
import switchRoutes from './switch.js';
import messageRoutes from './message.js';

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
  { path: '/payments', route: paymentsRoutes },
  { path: '/invoices', route: invoiceRoutes },
  { path: '/switch', route: switchRoutes },
  { path: '/message', route: messageRoutes }
];

lndRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
