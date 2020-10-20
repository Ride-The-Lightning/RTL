const PaymentsController = require("../../controllers/eclair/payments");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/route/", authCheck, PaymentsController.queryPaymentRoute);
router.get("/:invoice", authCheck, PaymentsController.decodePayment);
router.post("/getsentinfos", authCheck, PaymentsController.getSentPaymentsInformation);
router.post("/", authCheck, PaymentsController.postPayment);

module.exports = router;
