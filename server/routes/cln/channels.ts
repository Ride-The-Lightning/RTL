import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import {
  listChannels,
  openChannel,
  setChannelFee,
  closeChannel,
  getLocalRemoteBalance,
  listForwards
} from '../../controllers/cln/channels.js';

const router = Router();

router.get('/listChannels', isAuthenticated, listChannels);
router.post('/', isAuthenticated, openChannel);
router.post('/setChannelFee', isAuthenticated, setChannelFee);
router.delete('/:channelId', isAuthenticated, closeChannel);

router.get('/localremotebalance', isAuthenticated, getLocalRemoteBalance);
router.get('/listForwards', isAuthenticated, listForwards);

export default router;
