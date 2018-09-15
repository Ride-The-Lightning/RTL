const UISettingsController = require("../controllers/UISettings");
const express = require("express");
const router = express.Router();

router.get("/", UISettingsController.getUISettings);
router.post("/", UISettingsController.updateUISettings);

module.exports = router;
