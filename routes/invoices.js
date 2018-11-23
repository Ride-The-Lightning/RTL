const invoicesController = require("../controllers/invoices");
const express = require("express");
const router = express.Router();

router.get("/", invoicesController.listInvoices);
router.post("/", invoicesController.addInvoice);

module.exports = router;