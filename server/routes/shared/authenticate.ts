import { Router } from 'express';
import { authenticateUser, verifyToken, resetPassword } from '../../controllers/shared/authenticate';

const router = Router();

router.post('/', authenticateUser);
router.post('/token', verifyToken);
router.post('/reset', resetPassword);

export default router;
