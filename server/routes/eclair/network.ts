import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getNodes } from '../../controllers/eclair/network.js';

const router = Router();

router.get('/nodes/:id', isAuthenticated, getNodes);

export default router;
