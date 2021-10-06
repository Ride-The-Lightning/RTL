"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authCheck_1 = require("../../utils/authCheck");
const FeesController = require('../../controllers/c-lightning/fees');
const router = express_1.Router();
router.get('/', authCheck_1.isAuthenticated, FeesController.getFees);
exports.default = router;
