import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { signMessage, verifyMessage } from '../../controllers/c-lightning/message.js';
const router = Router();
router.post('/sign', isAuthenticated, signMessage);
router.post('/verify', isAuthenticated, verifyMessage);
export default router;
