import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getChannels, getChannelStats, openChannel, updateChannelRelayFee, closeChannel } from '../../controllers/eclair/channels.js';

const router = Router();

router.get('/', isAuthenticated, getChannels);
router.get('/stats', isAuthenticated, getChannelStats);
router.post('/', isAuthenticated, openChannel);
router.post('/updateRelayFee', isAuthenticated, updateChannelRelayFee);
router.delete('/', isAuthenticated, closeChannel);

export default router;
