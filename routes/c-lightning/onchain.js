const OnChainController = require("../../controllers/c-lightning/onchain");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, OnChainController.getNewAddress);
router.post("/", authCheck, OnChainController.onChainWithdraw);
router.get("/transactions/", authCheck, OnChainController.getTransactions);

module.exports = router;
