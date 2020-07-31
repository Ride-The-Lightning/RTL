const RTLConfController = require("../controllers/RTLConf");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/rtlconf", RTLConfController.getRTLConfig);
router.post("/", authCheck, RTLConfController.updateUISettings);
router.post("/update2FA", authCheck, RTLConfController.update2FASettings);
router.get("/config/:nodeType", authCheck, RTLConfController.getConfig);
router.get("/file", authCheck, RTLConfController.getFile);
router.post("/updateSelNode", RTLConfController.updateSelectedNode);
router.post("/updateDefaultNode", RTLConfController.updateDefaultNode);
router.get("/rates", RTLConfController.getCurrencyRates);
module.exports = router;
