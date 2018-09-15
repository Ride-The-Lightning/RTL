const BalanceController = require("../controllers/balance");
const express = require("express");
const router = express.Router();

router.get("/", BalanceController.getBalance);
router.get("/:source", BalanceController.getBalance);

module.exports = router;
