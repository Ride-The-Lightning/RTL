import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getNodes } from '../../controllers/eclair/network';

const router = Router();

router.get('/nodes/:id', isAuthenticated, getNodes);

export default router;
