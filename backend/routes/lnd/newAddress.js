"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const newAddress_1 = require("../../controllers/lnd/newAddress");
const router = express_1.Router();
router.get('/', authCheck_1.isAuthenticated, newAddress_1.getNewAddress);
exports.default = router;
