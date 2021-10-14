import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getFees } from '../../controllers/c-lightning/fees.js';

const router = Router();

router.get('/', isAuthenticated, getFees);

export default router;
