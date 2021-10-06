"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const switch_1 = require("../../controllers/lnd/switch");
const router = express_1.Router();
router.post('/', authCheck_1.isAuthenticated, switch_1.forwardingHistory);
exports.default = router;
