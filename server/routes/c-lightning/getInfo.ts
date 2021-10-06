import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getInfo } from '../../controllers/c-lightning/getInfo';

const router = Router();

router.get('/', isAuthenticated, getInfo);

export default router;
