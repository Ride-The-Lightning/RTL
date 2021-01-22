const OnChainController = require("../../controllers/eclair/onchain");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, OnChainController.getNewAddress);
router.get("/balance/", authCheck, OnChainController.getBalance);
router.get("/transactions/", authCheck, OnChainController.getTransactions);
router.post("/", authCheck, OnChainController.sendFunds);

module.exports = router;
