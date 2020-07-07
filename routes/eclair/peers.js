const PeersController = require("../../controllers/eclair/peers");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, PeersController.getPeers);
router.post("/", authCheck, PeersController.connectPeer);
router.delete("/:nodeId", authCheck, PeersController.deletePeer);

module.exports = router;
