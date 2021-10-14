import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getNewAddress } from '../../controllers/lnd/newAddress.js';
const router = Router();
router.get('/', isAuthenticated, getNewAddress);
export default router;
