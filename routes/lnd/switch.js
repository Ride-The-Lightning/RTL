const SwitchController = require("../../controllers/lnd/switch");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.post("/", authCheck, SwitchController.forwardingHistory);

module.exports = router;
