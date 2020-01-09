const LoopController = require("../../controllers/loopd/loop");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/loopin", authCheck, LoopController.loopIn);
router.get("/loopout", authCheck, LoopController.loopOut);

module.exports = router;
