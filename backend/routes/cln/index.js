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
import offersCLRoutes from './offers.js';
import utilityCLRoutes from './utility.js';
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
    { path: '/offers', route: offersCLRoutes },
    { path: '/utility', route: utilityCLRoutes }
];
clRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
export default router;
