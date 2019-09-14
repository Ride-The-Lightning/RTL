const infoController = require("../../controllers/lnd/getInfo");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, infoController.getInfo);

module.exports = router;
