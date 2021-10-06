import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { forwardingHistory } from '../../controllers/lnd/switch';

const router = Router();

router.post('/', isAuthenticated, forwardingHistory);

export default router;
