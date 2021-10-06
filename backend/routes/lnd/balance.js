"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const balance_1 = require("../../controllers/lnd/balance");
const router = express_1.Router();
router.get('/:source', authCheck_1.isAuthenticated, balance_1.getBalance);
exports.default = router;
