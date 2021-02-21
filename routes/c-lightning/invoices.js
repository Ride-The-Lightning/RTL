const invoicesController = require("../../controllers/c-lightning/invoices");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, invoicesController.listInvoices);
router.post("/", authCheck, invoicesController.addInvoice);
router.delete("/", authCheck, invoicesController.deleteExpiredInvoice);

module.exports = router;