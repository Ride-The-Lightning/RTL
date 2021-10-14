import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getTransactions, postTransactions } from '../../controllers/lnd/transactions.js';

const router = Router();

router.get('/', isAuthenticated, getTransactions);
router.post('/', isAuthenticated, postTransactions);

export default router;
