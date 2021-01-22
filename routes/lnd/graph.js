const graphController = require("../../controllers/lnd/graph");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, graphController.getDescribeGraph);
router.get("/info", authCheck, graphController.getGraphInfo);
router.get("/nodes", authCheck, graphController.getAliasesForPubkeys);
router.get("/node/:pubKey", authCheck, graphController.getGraphNode);
router.get("/edge/:chanid", authCheck, graphController.getGraphEdge);
router.get("/edge/:chanid/:localPubkey", authCheck, graphController.getRemoteFeePolicy);
router.get("/routes/:destPubkey/:amount", authCheck, graphController.getQueryRoutes);

module.exports = router;
