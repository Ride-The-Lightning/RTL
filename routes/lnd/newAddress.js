const NewAddressController = require("../../controllers/lnd/newAddress");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/", authCheck, NewAddressController.getNewAddress);

module.exports = router;
