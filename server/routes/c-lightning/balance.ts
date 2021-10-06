import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getBalance } from '../../controllers/c-lightning/balance';

const router = Router();

router.get('/', isAuthenticated, getBalance);

export default router;
