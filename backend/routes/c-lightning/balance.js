import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getBalance } from '../../controllers/c-lightning/balance.js';
const router = Router();
router.get('/', isAuthenticated, getBalance);
export default router;
