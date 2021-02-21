const PaymentsController = require("../../controllers/lnd/payments");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, PaymentsController.getPayments);

module.exports = router;
