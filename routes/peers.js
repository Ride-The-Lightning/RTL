const PeersController = require("../controllers/peers");
const express = require("express");
const router = express.Router();

router.get("/", PeersController.getPeers);
router.post("/", PeersController.postPeer);

module.exports = router;
