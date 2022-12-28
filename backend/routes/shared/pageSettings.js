import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getPageSettings, savePageSettings } from '../../controllers/shared/pageSettings.js';
const router = Router();
router.get('/', isAuthenticated, getPageSettings);
router.post('/', isAuthenticated, savePageSettings);
export default router;
