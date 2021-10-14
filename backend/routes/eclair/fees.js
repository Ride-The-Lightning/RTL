import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getFees, getPayments } from '../../controllers/eclair/fees.js';
const router = Router();
router.get('/fees', isAuthenticated, getFees);
router.get('/payments', isAuthenticated, getPayments);
export default router;
