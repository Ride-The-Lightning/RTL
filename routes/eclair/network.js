const NetworkController = require("../../controllers/eclair/network");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/nodes/:id", authCheck, NetworkController.getNodes);

module.exports = router;
