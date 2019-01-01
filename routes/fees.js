const FeesController = require("../controllers/fees");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/", authCheck, FeesController.getFees);

module.exports = router;
