import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getNewAddress, onChainWithdraw, getUTXOs } from '../../controllers/cln/onchain.js';
const router = Router();
router.post('/', isAuthenticated, onChainWithdraw);
router.post('/newaddr', isAuthenticated, getNewAddress);
router.get('/utxos/', isAuthenticated, getUTXOs);
export default router;
