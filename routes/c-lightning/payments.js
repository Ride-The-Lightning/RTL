const PaymentsController = require("../../controllers/c-lightning/payments");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, PaymentsController.listPayments);
router.get("/:invoice", authCheck, PaymentsController.decodePayment);
router.post("/:type", authCheck, PaymentsController.postPayment);

module.exports = router;
