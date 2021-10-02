const invoicesController = require("../../controllers/lnd/invoices");
const express = require("express");
const router = express.Router();
const authCheck = require("../../utils/authCheck");

router.get("/", authCheck, invoicesController.listInvoices);
router.get("/:rHashStr", authCheck, invoicesController.getInvoice);
router.post("/", authCheck, invoicesController.addInvoice);

module.exports = router;