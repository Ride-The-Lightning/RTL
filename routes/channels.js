const ChannelsController = require("../controllers/channels");
const express = require("express");
const router = express.Router();

router.get("/", ChannelsController.getChannels);
router.get("/:channelType", ChannelsController.getChannels);
router.post("/", ChannelsController.postChannel);

module.exports = router;
