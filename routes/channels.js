const ChannelsController = require("../controllers/channels");
const express = require("express");
const router = express.Router();

router.get("/", ChannelsController.getChannels);
router.get("/:channelType", ChannelsController.getChannels);
router.post("/", ChannelsController.postChannel);
router.post("/transactions", ChannelsController.postTransactions);
router.delete("/:channelPoint", ChannelsController.closeChannel);

module.exports = router;
