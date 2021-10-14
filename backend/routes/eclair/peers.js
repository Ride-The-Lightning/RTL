import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getPeers, connectPeer, deletePeer } from '../../controllers/eclair/peers.js';
const router = Router();
router.get('/', isAuthenticated, getPeers);
router.post('/', isAuthenticated, connectPeer);
router.delete('/:nodeId', isAuthenticated, deletePeer);
export default router;
