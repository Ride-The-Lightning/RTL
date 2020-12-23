const ChannelsBackupController = require("../../controllers/lnd/channelsBackup");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/:channelPoint", authCheck, ChannelsBackupController.getBackup);
router.get("/restore/list", authCheck, ChannelsBackupController.getRestoreList);
router.post("/verify/:channelPoint", authCheck, ChannelsBackupController.postBackupVerify);
router.post("/restore/:channelPoint", authCheck, ChannelsBackupController.postRestore);

module.exports = router;
