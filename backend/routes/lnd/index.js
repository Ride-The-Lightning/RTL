"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const getInfo_1 = require("./getInfo");
const channels_1 = require("./channels");
const channelsBackup_1 = require("./channelsBackup");
const peers_1 = require("./peers");
const fees_1 = require("./fees");
const balance_1 = require("./balance");
const wallet_1 = require("./wallet");
const graph_1 = require("./graph");
const newAddress_1 = require("./newAddress");
const transactions_1 = require("./transactions");
const payReq_1 = require("./payReq");
const payments_1 = require("./payments");
const invoices_1 = require("./invoices");
const switch_1 = require("./switch");
const message_1 = require("./message");
const router = express_1.Router();
const lndRoutes = [
    { path: '/getinfo', route: getInfo_1.default },
    { path: '/channels', route: channels_1.default },
    { path: '/channels/backup', route: channelsBackup_1.default },
    { path: '/peers', route: peers_1.default },
    { path: '/fees', route: fees_1.default },
    { path: '/balance', route: balance_1.default },
    { path: '/wallet', route: wallet_1.default },
    { path: '/network', route: graph_1.default },
    { path: '/newaddress', route: newAddress_1.default },
    { path: '/transactions', route: transactions_1.default },
    { path: '/payreq', route: payReq_1.default },
    { path: '/payments', route: payments_1.default },
    { path: '/invoices', route: invoices_1.default },
    { path: '/switch', route: switch_1.default },
    { path: '/message', route: message_1.default }
];
lndRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
