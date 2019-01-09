const invoicesController = require("../controllers/invoices");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/", authCheck, invoicesController.listInvoices);
router.get("/:rHashStr", authCheck, invoicesController.getInvoice);
router.post("/", authCheck, invoicesController.addInvoice);

module.exports = router;