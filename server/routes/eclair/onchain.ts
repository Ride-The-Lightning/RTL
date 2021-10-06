import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getNewAddress, getBalance, getTransactions, sendFunds } from '../../controllers/eclair/onchain';

const router = Router();

router.get('/', isAuthenticated, getNewAddress);
router.get('/balance/', isAuthenticated, getBalance);
router.get('/transactions/', isAuthenticated, getTransactions);
router.post('/', isAuthenticated, sendFunds);

export default router;
