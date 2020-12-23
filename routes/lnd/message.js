const MessagesController = require("../../controllers/lnd/message");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.post("/sign", authCheck, MessagesController.signMessage);
router.post("/verify", authCheck, MessagesController.verifyMessage);

module.exports = router;
