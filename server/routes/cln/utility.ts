import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { decodePayments, decodePayment, signMessage, verifyMessage, listConfigs } from '../../controllers/cln/utility.js';

const router = Router();

router.get('/', isAuthenticated, decodePayments);
router.get('/decode/:payReq', isAuthenticated, decodePayment);
router.post('/sign', isAuthenticated, signMessage);
router.post('/verify', isAuthenticated, verifyMessage);
router.get('/listConfigs', isAuthenticated, listConfigs);

export default router;
