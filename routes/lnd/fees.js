const FeesController = require("../../controllers/lnd/fees");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, FeesController.getFees);

module.exports = router;
