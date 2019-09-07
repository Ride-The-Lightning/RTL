const PaymentsController = require("../../controllers/c-lightning/payments");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, PaymentsController.getPayments);

module.exports = router;
