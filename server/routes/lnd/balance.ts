import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getBalance } from '../../controllers/lnd/balance.js';

const router = Router();

router.get('/:source', isAuthenticated, getBalance);

export default router;
