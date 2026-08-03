import exprs from 'express';
const { Router } = exprs;
import { authenticateUser, verifyToken, resetPassword, logoutUser } from '../../controllers/shared/authenticate.js';
import { isAuthenticated } from '../../utils/authCheck.js';

const router = Router();

router.post('/', authenticateUser);
router.post('/token', verifyToken);
// Password changes mint a fresh session token, so the route requires an existing
// authenticated session; the frontend interceptor attaches it for the settings UI.
router.post('/reset', isAuthenticated, resetPassword);
router.get('/logout', logoutUser);

export default router;
