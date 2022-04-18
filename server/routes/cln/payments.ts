import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listPayments, decodePayment, postPayment } from '../../controllers/cln/payments.js';

const router = Router();

router.get('/', isAuthenticated, listPayments);
router.get('/decode/:payReq', isAuthenticated, decodePayment);
router.post('/', isAuthenticated, postPayment);

export default router;
