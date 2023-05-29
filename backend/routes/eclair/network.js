import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getNodes, findRouteBetweenNodes } from '../../controllers/eclair/network.js';
const router = Router();
router.get('/nodes/:id', isAuthenticated, getNodes);
router.get('/routebetweennodes', isAuthenticated, findRouteBetweenNodes);
export default router;
