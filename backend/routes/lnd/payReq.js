"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const payReq_1 = require("../../controllers/lnd/payReq");
const router = express_1.Router();
router.get('/:payRequest', authCheck_1.isAuthenticated, payReq_1.decodePayment);
router.post('/', authCheck_1.isAuthenticated, payReq_1.decodePayments);
exports.default = router;
