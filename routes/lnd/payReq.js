const PayRequestController = require("../../controllers/lnd/payReq");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/:payRequest", authCheck, PayRequestController.decodePayment);

module.exports = router;
