const FeesController = require("../../controllers/eclair/fees");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/fees", authCheck, FeesController.getFees);
router.get("/payments", authCheck, FeesController.getPayments);

module.exports = router;
