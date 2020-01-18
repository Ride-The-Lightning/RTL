const LoopController = require("../../controllers/lnd/loop/loop");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/in/terms", authCheck, LoopController.loopInTerms);
router.get("/in/quote", authCheck, LoopController.loopInQuote);
router.post("/in", authCheck, LoopController.loopIn);
router.get("/out/terms", authCheck, LoopController.loopOutTerms);
router.get("/out/quote", authCheck, LoopController.loopOutQuote);
router.post("/out", authCheck, LoopController.loopOut);

module.exports = router;
