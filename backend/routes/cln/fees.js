import * as exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getFees } from '../../controllers/cln/fees.js';
const router = Router();
router.get('/', isAuthenticated, getFees);
export default router;
