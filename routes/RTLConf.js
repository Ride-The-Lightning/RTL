const RTLConfController = require("../controllers/RTLConf");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/rtlconf", RTLConfController.getRTLConfig);
router.post("/", authCheck, RTLConfController.updateUISettings);
router.get("/lndconfig", authCheck, RTLConfController.getLNDConfig);

module.exports = router;
