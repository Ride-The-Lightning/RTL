const PaymentsController = require("../../controllers/lnd/payments");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, PaymentsController.getPayments);
router.get("/total", authCheck, PaymentsController.getTotalPayments); // Delete after LND fixes https://github.com/lightningnetwork/lnd/issues/5382

module.exports = router;
