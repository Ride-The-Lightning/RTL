"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("./authenticate");
const boltz_1 = require("./boltz");
const loop_1 = require("./loop");
const RTLConf_1 = require("./RTLConf");
const router = express_1.Router();
const sharedRoutes = [
    { path: '/authenticate', route: authenticate_1.default },
    { path: '/boltz', route: boltz_1.default },
    { path: '/loop', route: loop_1.default },
    { path: '/conf', route: RTLConf_1.default }
];
sharedRoutes.forEach((route) => {
    router.use(route.path, route.route);
});
exports.default = router;
