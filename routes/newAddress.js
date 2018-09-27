const NewAddressController = require("../controllers/newAddress");
const express = require("express");
const router = express.Router();

router.get("/", NewAddressController.getNewAddress);

module.exports = router;
