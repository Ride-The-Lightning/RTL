"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const fees_1 = require("../../controllers/lnd/fees");
const router = express_1.Router();
router.get('/', authCheck_1.isAuthenticated, fees_1.getFees);
exports.default = router;
