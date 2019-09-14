const BalanceController = require("../../controllers/c-lightning/balance");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, BalanceController.getBalance);

module.exports = router;
