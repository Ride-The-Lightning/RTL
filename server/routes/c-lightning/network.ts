import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getRoute, listNode, listChannel, feeRates } from '../../controllers/c-lightning/network.js';

const router = Router();

router.get('/getRoute/:destPubkey/:amount', isAuthenticated, getRoute);
router.get('/listNode/:id', isAuthenticated, listNode);
router.get('/listChannel/:channelShortId', isAuthenticated, listChannel);
router.get('/feeRates/:feeRateStyle', isAuthenticated, feeRates);

export default router;
