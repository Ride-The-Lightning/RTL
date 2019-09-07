const NewAddressController = require("../../controllers/c-lightning/newAddress");
const express = require("express");
const router = express.Router();
const authCheck = require("../authCheck");

router.get("/", authCheck, NewAddressController.getNewAddress);

module.exports = router;
