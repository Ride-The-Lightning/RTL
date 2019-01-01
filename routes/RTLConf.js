const RTLConfController = require("../controllers/RTLConf");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/lndconfig", authCheck, RTLConfController.getLNDConfig);
router.get("/uisettings", RTLConfController.getUISettings);
router.post("/", authCheck, RTLConfController.updateUISettings);

module.exports = router;
