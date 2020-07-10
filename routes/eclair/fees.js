const FeesController = require("../../controllers/eclair/fees");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, FeesController.getFees);

module.exports = router;
