const ChannelsController = require("../../controllers/lnd/channels");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, ChannelsController.getAllChannels);
router.get("/pending", authCheck, ChannelsController.getPendingChannels);
router.get("/closed", authCheck, ChannelsController.getClosedChannels);
router.post("/", authCheck, ChannelsController.postChannel);
router.post("/transactions", authCheck, ChannelsController.postTransactions);
router.delete("/:channelPoint", authCheck, ChannelsController.closeChannel);
router.post("/chanPolicy", authCheck, ChannelsController.postChanPolicy);

module.exports = router;
