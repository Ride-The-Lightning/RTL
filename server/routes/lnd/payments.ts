import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getPayments, getAllLightningTransactions } from '../../controllers/lnd/payments';

const router = Router();

router.get('/', isAuthenticated, getPayments);
router.get('/alltransactions', isAuthenticated, getAllLightningTransactions);

export default router;
