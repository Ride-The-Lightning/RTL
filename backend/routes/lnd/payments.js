"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const payments_1 = require("../../controllers/lnd/payments");
const router = express_1.Router();
router.get('/', authCheck_1.isAuthenticated, payments_1.getPayments);
router.get('/alltransactions', authCheck_1.isAuthenticated, payments_1.getAllLightningTransactions);
exports.default = router;
