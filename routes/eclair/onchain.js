const OnChainController = require("../../controllers/eclair/onchain");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, OnChainController.getNewAddress);

module.exports = router;
