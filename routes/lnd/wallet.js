const WalletController = require("../../controllers/lnd/wallet");
const express = require("express");
const router = express.Router();
const authCheck = require("../shared/authCheck");

router.get("/genseed/:passphrase?", authCheck, WalletController.genSeed);
router.get("/updateSelNodeOptions", authCheck, WalletController.updateSelNodeOptions);
router.get("/getUTXOs", authCheck, WalletController.getUTXOs);
router.post("/wallet/:operation", authCheck, WalletController.operateWallet);
router.post("/bumpfee", authCheck, WalletController.bumpFee);
router.post("/label", authCheck, WalletController.labelTransaction);
router.post("/lease", authCheck, WalletController.leaseUTXO);
router.post("/release", authCheck, WalletController.releaseUTXO);

module.exports = router;
