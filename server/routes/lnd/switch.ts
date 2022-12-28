import * as exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { forwardingHistory } from '../../controllers/lnd/switch.js';

const router = Router();

router.post('/', isAuthenticated, forwardingHistory);

export default router;
