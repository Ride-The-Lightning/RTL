const BoltzSwapsController = require("../../controllers/lnd/boltzSwaps");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/swaps/list", authCheck, BoltzSwapsController.getSwapsList);
router.post("/swaps/add", authCheck, BoltzSwapsController.addSwap);

module.exports = router;
