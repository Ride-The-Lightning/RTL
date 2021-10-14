import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { listPayments, decodePayment, postPayment } from '../../controllers/c-lightning/payments.js';
const router = Router();
router.get('/', isAuthenticated, listPayments);
router.get('/:invoice', isAuthenticated, decodePayment);
router.post('/:type', isAuthenticated, postPayment);
export default router;
