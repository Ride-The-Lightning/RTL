const FeesController = require("../../controllers/lnd/fees");
const express = require("express");
const router = express.Router();
const authCheck = require("../../utils/authCheck");

router.get("/", authCheck, FeesController.getFees);

module.exports = router;
