import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { genSeed, updateSelNodeOptions, getUTXOs, operateWallet, bumpFee, labelTransaction, leaseUTXO, releaseUTXO } from '../../controllers/lnd/wallet.js';

const router = Router();

router.get('/genseed/:passphrase?', isAuthenticated, genSeed);
router.get('/updateSelNodeOptions', isAuthenticated, updateSelNodeOptions);
router.get('/getUTXOs', isAuthenticated, getUTXOs);
router.post('/wallet/:operation', isAuthenticated, operateWallet);
router.post('/bumpfee', isAuthenticated, bumpFee);
router.post('/label', isAuthenticated, labelTransaction);
router.post('/lease', isAuthenticated, leaseUTXO);
router.post('/release', isAuthenticated, releaseUTXO);

export default router;
