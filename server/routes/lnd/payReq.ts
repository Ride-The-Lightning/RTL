import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { decodePayment, decodePayments } from '../../controllers/lnd/payReq';

const router = Router();

router.get('/:payRequest', isAuthenticated, decodePayment);
router.post('/', isAuthenticated, decodePayments);

export default router;
