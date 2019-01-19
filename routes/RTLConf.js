const RTLConfController = require("../controllers/RTLConf");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/rtlconf", RTLConfController.getRTLConfig);
router.post("/", authCheck, RTLConfController.updateUISettings);
router.get("/config/:nodeType", authCheck, RTLConfController.getConfig);

module.exports = router;
