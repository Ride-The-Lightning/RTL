const infoController = require("../../controllers/c-lightning/getInfo");
const express = require("express");
const router = express.Router();
const authCheck = require("../../utils/authCheck");

router.get("/", authCheck, infoController.getInfo);

module.exports = router;
