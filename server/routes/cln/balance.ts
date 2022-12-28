import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getBalance } from '../../controllers/cln/balance.js';

const router = Router();

router.get('/', isAuthenticated, getBalance);

export default router;
