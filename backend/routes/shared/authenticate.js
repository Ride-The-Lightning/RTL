import exprs from 'express';
const { Router } = exprs;
import { authenticateUser, verifyToken, resetPassword } from '../../controllers/shared/authenticate.js';
const router = Router();
router.post('/', authenticateUser);
router.post('/token', verifyToken);
router.post('/reset', resetPassword);
export default router;
