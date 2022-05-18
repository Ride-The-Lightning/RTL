import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import {
  queryPaymentRoute,
  decodePayment,
  getSentPaymentsInformation,
  postPayment
} from '../../controllers/eclair/payments.js';

const router = Router();

router.get('/route/', isAuthenticated, queryPaymentRoute);
router.get('/decode/:invoice', isAuthenticated, decodePayment);
router.post('/getsentinfos', isAuthenticated, getSentPaymentsInformation);
router.post('/', isAuthenticated, postPayment);

export default router;
