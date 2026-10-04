import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getChannels, openChannel, updateChannelRelayFee, closeChannel, circularRebalance } from '../../controllers/eclair/channels.js';

const router = Router();

router.get('/', isAuthenticated, getChannels);
router.post('/', isAuthenticated, openChannel);
router.post('/updateRelayFee', isAuthenticated, updateChannelRelayFee);
router.post('/circularRebalance', isAuthenticated, circularRebalance);
router.delete('/', isAuthenticated, closeChannel);

export default router;
