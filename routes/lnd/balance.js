const BalanceController = require("../../controllers/lnd/balance");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/:source", authCheck, BalanceController.getBalance);

module.exports = router;
