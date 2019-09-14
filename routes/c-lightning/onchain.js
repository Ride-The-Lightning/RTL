const OnChainController = require("../../controllers/c-lightning/onchain");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, OnChainController.getNewAddress);
router.post("/", authCheck, OnChainController.onChainWithdraw);

module.exports = router;
