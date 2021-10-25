import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getPeers, postPeer, deletePeer } from '../../controllers/c-lightning/peers.js';

const router = Router();

router.get('/', isAuthenticated, getPeers);
router.post('/', isAuthenticated, postPeer);
router.delete('/:peerId', isAuthenticated, deletePeer);

export default router;
