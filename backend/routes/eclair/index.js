"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const getInfo_1 = require("./getInfo");
const fees_1 = require("./fees");
const channels_1 = require("./channels");
const onchain_1 = require("./onchain");
const peers_1 = require("./peers");
const invoices_1 = require("./invoices");
const payments_1 = require("./payments");
const network_1 = require("./network");
const webSocket_1 = require("./webSocket");
const router = express_1.Router();
const eclRoutes = [
    { path: '/getinfo', route: getInfo_1.default },
    { path: '/fees', route: fees_1.default },
    { path: '/channels', route: channels_1.default },
    { path: '/onchain', route: onchain_1.default },
    { path: '/peers', route: peers_1.default },
    { path: '/invoices', route: invoices_1.default },
    { path: '/payments', route: payments_1.default },
    { path: '/network', route: network_1.default },
    { path: '/ws', route: webSocket_1.default }
];
eclRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
