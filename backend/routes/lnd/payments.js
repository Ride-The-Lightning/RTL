import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getPayments, getAllLightningTransactions } from '../../controllers/lnd/payments.js';
const router = Router();
router.get('/', isAuthenticated, getPayments);
router.get('/alltransactions', isAuthenticated, getAllLightningTransactions);
export default router;
