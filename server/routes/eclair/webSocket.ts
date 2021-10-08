import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { SSEventControl } from '../../controllers/eclair/webSocket';

const router = Router();

router.get('/', isAuthenticated, SSEventControl);

export default router;
