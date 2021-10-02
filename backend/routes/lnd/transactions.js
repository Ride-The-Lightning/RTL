const TransactionsController = require("../../controllers/lnd/transactions");
const express = require("express");
const router = express.Router();
const authCheck = require("../../utils/authCheck");

router.get("/", authCheck, TransactionsController.getTransactions);
router.post("/", authCheck, TransactionsController.postTransactions);

module.exports = router;
