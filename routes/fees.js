const FeesController = require("../controllers/fees");
const express = require("express");
const router = express.Router();

router.get("/", FeesController.getFees);

module.exports = router;
