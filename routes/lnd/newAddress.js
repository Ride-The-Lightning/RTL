const NewAddressController = require("../../controllers/lnd/newAddress");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, NewAddressController.getNewAddress);

module.exports = router;
