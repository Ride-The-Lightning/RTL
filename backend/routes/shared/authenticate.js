import * as exprs from 'express';
const { Router } = exprs;
import { authenticateUser, verifyToken, resetPassword, logoutUser } from '../../controllers/shared/authenticate.js';
const router = Router();
router.post('/', authenticateUser);
router.post('/token', verifyToken);
router.post('/reset', resetPassword);
router.get('/logout', logoutUser);
export default router;
