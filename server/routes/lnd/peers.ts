import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getPeers, postPeer, deletePeer } from '../../controllers/lnd/peers';

const router = Router();

router.get('/', isAuthenticated, getPeers);
router.post('/', isAuthenticated, postPeer);
router.delete('/:peerPubKey', isAuthenticated, deletePeer);

export default router;
