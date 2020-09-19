const BoltzSwapsController = require("../../controllers/lnd/boltzSwaps");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/boltz/serverUrl", authCheck, BoltzSwapsController.getServerUrl);

router.get("/swaps/list", authCheck, BoltzSwapsController.getSwapsList);
router.post("/swaps/add", authCheck, BoltzSwapsController.addSwap);

module.exports = router;
