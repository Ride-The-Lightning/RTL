"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const transactions_1 = require("../../controllers/lnd/transactions");
const router = express_1.Router();
router.get('/', authCheck_1.isAuthenticated, transactions_1.getTransactions);
router.post('/', authCheck_1.isAuthenticated, transactions_1.postTransactions);
exports.default = router;
