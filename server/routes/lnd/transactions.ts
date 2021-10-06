import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getTransactions, postTransactions } from '../../controllers/lnd/transactions';

const router = Router();

router.get('/', isAuthenticated, getTransactions);
router.post('/', isAuthenticated, postTransactions);

export default router;
