import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listPayments, postPayment } from '../../controllers/cln/payments.js';

const router = Router();

router.get('/', isAuthenticated, listPayments);
router.post('/', isAuthenticated, postPayment);

export default router;
