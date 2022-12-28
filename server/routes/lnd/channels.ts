import * as exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getAllChannels, getPendingChannels, getClosedChannels, postChannel, postTransactions, closeChannel, postChanPolicy } from '../../controllers/lnd/channels.js';

const router = Router();

router.get('/', isAuthenticated, getAllChannels);
router.get('/pending', isAuthenticated, getPendingChannels);
router.get('/closed', isAuthenticated, getClosedChannels);
router.post('/', isAuthenticated, postChannel);
router.post('/transactions', isAuthenticated, postTransactions);
router.delete('/:channelPoint', isAuthenticated, closeChannel);
router.post('/chanPolicy', isAuthenticated, postChanPolicy);

export default router;
