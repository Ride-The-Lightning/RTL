const PeersController = require("../../controllers/lnd/peers");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, PeersController.getPeers);
router.post("/", authCheck, PeersController.postPeer);
router.delete("/:peerPubKey", authCheck, PeersController.deletePeer);

module.exports = router;
