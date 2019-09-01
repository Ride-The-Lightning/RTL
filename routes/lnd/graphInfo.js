const graphInfoController = require("../../controllers/graphInfo");
const express = require("express");
const router = express.Router();

router.get("/", graphInfoController.getGraphInfo);

module.exports = router;
