import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getPeers, postPeer, deletePeer } from '../../controllers/c-lightning/peers';

const router = Router();

router.get('/', isAuthenticated, getPeers);
router.post('/', isAuthenticated, postPeer);
router.delete('/:peerId', isAuthenticated, deletePeer);

export default router;
