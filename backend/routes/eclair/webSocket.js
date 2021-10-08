"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const webSocket_1 = require("../../controllers/eclair/webSocket");
const router = express_1.Router();
router.get('/', authCheck_1.isAuthenticated, webSocket_1.SSEventControl);
exports.default = router;
