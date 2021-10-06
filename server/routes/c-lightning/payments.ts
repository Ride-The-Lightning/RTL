import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { listPayments, decodePayment, postPayment } from '../../controllers/c-lightning/payments';

const router = Router();

router.get('/', isAuthenticated, listPayments);
router.get('/:invoice', isAuthenticated, decodePayment);
router.post('/:type', isAuthenticated, postPayment);

export default router;
