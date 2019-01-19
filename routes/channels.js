const ChannelsController = require("../controllers/channels");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/", authCheck, ChannelsController.getChannels);
router.post("/", authCheck, ChannelsController.postChannel);
router.get("/:channelType", authCheck, ChannelsController.getChannels);
router.post("/transactions", authCheck, ChannelsController.postTransactions);
router.delete("/:channelPoint", authCheck, ChannelsController.closeChannel);
router.post("/chanPolicy", authCheck, ChannelsController.postChanPolicy);

module.exports = router;
