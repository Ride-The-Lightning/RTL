import * as exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getBlockchainBalance } from '../../controllers/lnd/balance.js';

const router = Router();

router.get('/', isAuthenticated, getBlockchainBalance);

export default router;
