const invoicesController = require("../../controllers/eclair/invoices");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, invoicesController.listInvoices);
router.post("/", authCheck, invoicesController.createInvoice);

module.exports = router;