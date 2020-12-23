const ChannelsController = require("../../controllers/c-lightning/channels");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/listChannels", authCheck, ChannelsController.listChannels);
router.post("/", authCheck, ChannelsController.openChannel);
router.post("/setChannelFee", authCheck, ChannelsController.setChannelFee);
router.delete("/:channelId", authCheck, ChannelsController.closeChannel);

router.get("/localremotebalance", authCheck, ChannelsController.getLocalRemoteBalance);
router.get("/listForwards", authCheck, ChannelsController.listForwards);

module.exports = router;
