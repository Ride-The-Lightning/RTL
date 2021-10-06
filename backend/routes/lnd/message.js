"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const message_1 = require("../../controllers/lnd/message");
const router = express_1.Router();
router.post('/sign', authCheck_1.isAuthenticated, message_1.signMessage);
router.post('/verify', authCheck_1.isAuthenticated, message_1.verifyMessage);
exports.default = router;
