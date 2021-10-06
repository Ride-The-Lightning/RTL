"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const getInfo_1 = require("../../controllers/lnd/getInfo");
const router = express_1.Router();
router.get('/', authCheck_1.isAuthenticated, getInfo_1.getInfo);
exports.default = router;
