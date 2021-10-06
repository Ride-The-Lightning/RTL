"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const network_1 = require("../../controllers/eclair/network");
const router = express_1.Router();
router.get('/nodes/:id', authCheck_1.isAuthenticated, network_1.getNodes);
exports.default = router;
