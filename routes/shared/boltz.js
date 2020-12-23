const BoltzController = require("../../controllers/shared/boltz");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/info", authCheck, BoltzController.getInfo);

module.exports = router;
