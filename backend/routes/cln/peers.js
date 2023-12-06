import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getPeers, postPeer, deletePeer } from '../../controllers/cln/peers.js';
const router = Router();
router.get('/', isAuthenticated, getPeers);
router.post('/', isAuthenticated, postPeer);
router.post('/disconnect/', isAuthenticated, deletePeer);
export default router;
