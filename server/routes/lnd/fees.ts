import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getFees } from '../../controllers/lnd/fees';

const router = Router();

router.get('/', isAuthenticated, getFees);

export default router;
