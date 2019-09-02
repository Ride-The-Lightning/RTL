const ChannelsController = require("../../controllers/c-lightning/channels");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/localremotebalance", authCheck, ChannelsController.getLocalRemoteBalance);

module.exports = router;
