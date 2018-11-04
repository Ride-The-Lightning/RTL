const graphController = require("../controllers/graph");
const express = require("express");
const router = express.Router();

router.get("/info", graphController.getGraphInfo);
router.get("/node/:pubKey", graphController.getGraphNode);

module.exports = router;
