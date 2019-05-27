const WalletController = require("../controllers/wallet");
const express = require("express");
const router = express.Router();
const authCheck = require("./authCheck");

router.get("/genseed/:passphrase?", authCheck, WalletController.genSeed);
router.post("/:operation", authCheck, WalletController.operateWallet);

module.exports = router;
