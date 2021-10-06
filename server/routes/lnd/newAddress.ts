import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getNewAddress } from '../../controllers/lnd/newAddress';

const router = Router();

router.get('/', isAuthenticated, getNewAddress);

export default router;
