const BalanceController = require("../../controllers/eclair/balance");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, BalanceController.getBalance);

module.exports = router;
