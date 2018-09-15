const WalletController = require("../controllers/wallet");
const express = require("express");
const router = express.Router();

router.post("/:operation", WalletController.operateWallet);

module.exports = router;
