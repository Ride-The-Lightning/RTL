import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { queryPaymentRoute, decodePayment, getSentPaymentsInformation, postPayment } from '../../controllers/eclair/payments';

const router = Router();

router.get('/route/', isAuthenticated, queryPaymentRoute);
router.get('/:invoice', isAuthenticated, decodePayment);
router.post('/getsentinfos', isAuthenticated, getSentPaymentsInformation);
router.post('/', isAuthenticated, postPayment);

export default router;
