import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { signMessage, verifyMessage } from '../../controllers/lnd/message';

const router = Router();

router.post('/sign', isAuthenticated, signMessage);
router.post('/verify', isAuthenticated, verifyMessage);

export default router;
