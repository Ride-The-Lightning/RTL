const PaymentsController = require("../../controllers/c-lightning/payments");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, PaymentsController.listPayments);
router.get("/:invoice", authCheck, PaymentsController.decodePayment);
router.post("/", authCheck, PaymentsController.postPayment);

module.exports = router;
