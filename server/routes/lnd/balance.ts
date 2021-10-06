import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getBalance } from '../../controllers/lnd/balance';

const router = Router();

router.get('/:source', isAuthenticated, getBalance);

export default router;
