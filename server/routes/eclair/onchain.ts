import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getNewAddress, getBalance, getTransactions, sendFunds } from '../../controllers/eclair/onchain.js';

const router = Router();

router.get('/', isAuthenticated, getNewAddress);
router.get('/balance/', isAuthenticated, getBalance);
router.get('/transactions/', isAuthenticated, getTransactions);
router.post('/', isAuthenticated, sendFunds);

export default router;
