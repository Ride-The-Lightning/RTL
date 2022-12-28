import * as exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getInfo, getServiceInfo, listSwaps, getSwapInfo, createSwap, createReverseSwap, createChannel, deposit } from '../../controllers/shared/boltz.js';

const router = Router();

router.get('/info', isAuthenticated, getInfo);
router.get('/serviceInfo', isAuthenticated, getServiceInfo);
router.get('/listSwaps', isAuthenticated, listSwaps);
router.get('/swapInfo/:swapId', isAuthenticated, getSwapInfo);
router.post('/createSwap', isAuthenticated, createSwap);
router.post('/createReverseSwap', isAuthenticated, createReverseSwap);
router.post('/createChannel', isAuthenticated, createChannel);
router.post('/deposit', isAuthenticated, deposit);

export default router;
