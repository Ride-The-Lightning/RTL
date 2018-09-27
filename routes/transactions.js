const TransactionsController = require("../controllers/transactions");
const express = require("express");
const router = express.Router();

router.post("/", TransactionsController.postTransactions);

module.exports = router;
