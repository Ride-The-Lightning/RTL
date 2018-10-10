const PaymentsController = require("../controllers/payments");
const express = require("express");
const router = express.Router();

router.get("/", PaymentsController.getPayments);

module.exports = router;
