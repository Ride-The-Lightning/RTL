const LoopController = require("../../controllers/lnd/loop");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/in/terms", authCheck, LoopController.loopInTerms);
router.get("/in/quote/:amount", authCheck, LoopController.loopInQuote);
router.get("/in/termsAndQuotes", authCheck, LoopController.loopInTermsAndQuotes);
router.post("/in", authCheck, LoopController.loopIn);
router.get("/out/terms", authCheck, LoopController.loopOutTerms);
router.get("/out/quote/:amount", authCheck, LoopController.loopOutQuote);
router.get("/out/termsAndQuotes", authCheck, LoopController.loopOutTermsAndQuotes);
router.post("/out", authCheck, LoopController.loopOut);
router.get("/monitor", authCheck, LoopController.loopMonitor);

module.exports = router;
