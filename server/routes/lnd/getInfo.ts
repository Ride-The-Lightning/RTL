import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getInfo } from '../../controllers/lnd/getInfo';

const router = Router();

router.get('/', isAuthenticated, getInfo);

export default router;
