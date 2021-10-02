const infoController = require("../../controllers/eclair/getInfo");
const express = require("express");
const router = express.Router();
const authCheck = require("../../utils/authCheck");

router.get("/", authCheck, infoController.getInfo);

module.exports = router;
