const ChannelsController = require("../../controllers/eclair/channels");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, ChannelsController.getChannels);
router.get("/stats", authCheck, ChannelsController.getChannelStats);
router.post("/", authCheck, ChannelsController.openChannel);
router.post("/updateRelayFee", authCheck, ChannelsController.updateChannelRelayFee);
router.delete("/", authCheck, ChannelsController.closeChannel);

module.exports = router;
