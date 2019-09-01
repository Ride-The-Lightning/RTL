const LNDSettingsController = require("../../controllers/lndConfSettings");
const express = require("express");
const router = express.Router();

router.get("/", LNDSettingsController.getLNDSettings);

module.exports = router;
