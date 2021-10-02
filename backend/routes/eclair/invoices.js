const invoicesController = require("../../controllers/eclair/invoices");
const express = require("express");
const router = express.Router();
const authCheck = require("../../utils/authCheck");

router.get("/", authCheck, invoicesController.listInvoices);
router.get("/:paymentHash", authCheck, invoicesController.getInvoice);
router.post("/", authCheck, invoicesController.createInvoice);

module.exports = router;