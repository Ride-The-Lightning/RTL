const BoltzController = require("../../controllers/shared/boltz");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/info", authCheck, BoltzController.getInfo);
router.get("/serviceInfo", authCheck, BoltzController.getServiceInfo);
router.get("/listSwaps", authCheck, BoltzController.listSwaps);
router.get("/swapInfo/:swapId", authCheck, BoltzController.getSwapInfo);
router.post("/createSwap", authCheck, BoltzController.createSwap);
router.post("/createReverseSwap", authCheck, BoltzController.createReverseSwap);
router.post("/createChannel", authCheck, BoltzController.createChannel);
router.post("/deposit", authCheck, BoltzController.deposit);

module.exports = router;
