const infoController = require("../controllers/getInfo");
const express = require("express");
const router = express.Router();

router.get("/", infoController.getInfo);

module.exports = router;
