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
// A POST, so the CSRF check applies: as a GET, a link or page on another site could end a
// logged-in user's session. It needs no session token, as logout also follows a failed one.
router.post('/logout', logoutUser);

export default router;
