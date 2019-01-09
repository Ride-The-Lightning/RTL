const TransactionsController = require("../controllers/transactions");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/", authCheck, TransactionsController.getTransactions);
router.post("/", authCheck, TransactionsController.postTransactions);

module.exports = router;
