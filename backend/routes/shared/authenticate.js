"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authenticate_1 = require("../../controllers/shared/authenticate");
const router = express_1.Router();
router.post('/', authenticate_1.authenticateUser);
router.post('/token', authenticate_1.verifyToken);
router.post('/reset', authenticate_1.resetPassword);
exports.default = router;
