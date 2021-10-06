"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const fees_1 = require("../../controllers/eclair/fees");
const router = express_1.Router();
router.get('/fees', authCheck_1.isAuthenticated, fees_1.getFees);
router.get('/payments', authCheck_1.isAuthenticated, fees_1.getPayments);
exports.default = router;
