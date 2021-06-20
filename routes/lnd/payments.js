const PaymentsController = require("../../controllers/lnd/payments");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, PaymentsController.getPayments);
router.get("/alltransactions", authCheck, PaymentsController.getAllLightningTransactions);

module.exports = router;
