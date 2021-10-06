"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const getInfo_1 = require("./getInfo");
const fees_1 = require("./fees");
const balance_1 = require("./balance");
const channels_1 = require("./channels");
const invoices_1 = require("./invoices");
const onchain_1 = require("./onchain");
const payments_1 = require("./payments");
const peers_1 = require("./peers");
const network_1 = require("./network");
const message_1 = require("./message");
const router = express_1.Router();
const clRoutes = [
    { path: '/getinfo', route: getInfo_1.default },
    { path: '/fees', route: fees_1.default },
    { path: '/balance', route: balance_1.default },
    { path: '/channels', route: channels_1.default },
    { path: '/invoices', route: invoices_1.default },
    { path: '/onchain', route: onchain_1.default },
    { path: '/payments', route: payments_1.default },
    { path: '/peers', route: peers_1.default },
    { path: '/network', route: network_1.default },
    { path: '/message', route: message_1.default }
];
clRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
