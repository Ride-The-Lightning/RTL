import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listPayments, decodePayment, postPayment } from '../../controllers/c-lightning/payments.js';

const router = Router();

router.get('/', isAuthenticated, listPayments);
router.get('/:payReq', isAuthenticated, decodePayment);
router.post('/', isAuthenticated, postPayment);

export default router;
