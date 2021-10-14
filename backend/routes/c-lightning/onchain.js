import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getNewAddress, onChainWithdraw, getUTXOs } from '../../controllers/c-lightning/onchain.js';
const router = Router();
router.get('/', isAuthenticated, getNewAddress);
router.post('/', isAuthenticated, onChainWithdraw);
router.get('/utxos/', isAuthenticated, getUTXOs);
export default router;
