const SwitchController = require("../../controllers/lnd/switch");
const express = require("express");
const router = express.Router();
const authCheck = require("../../utils/authCheck");

router.post("/", authCheck, SwitchController.forwardingHistory);

module.exports = router;
