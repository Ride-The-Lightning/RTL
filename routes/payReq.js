const PayRequestController = require("../controllers/payReq");
const express = require("express");
const router = express.Router();

router.get("/:payRequest", PayRequestController.decodePayment);

module.exports = router;
