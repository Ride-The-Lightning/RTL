import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import {
  decodePayment,
  decodePayments,
  getPayments,
  getAllLightningTransactions,
  paymentLookup
} from '../../controllers/lnd/payments.js';

const router = Router();

router.get('/', isAuthenticated, getPayments);
router.get('/alltransactions', isAuthenticated, getAllLightningTransactions);
router.get('/decode/:payRequest', isAuthenticated, decodePayment);
router.get('/lookup/:paymentHash', isAuthenticated, paymentLookup);
router.post('/', isAuthenticated, decodePayments);

export default router;
