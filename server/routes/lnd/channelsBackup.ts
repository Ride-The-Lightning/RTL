import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { getBackup, getRestoreList, postBackupVerify, postRestore } from '../../controllers/lnd/channelsBackup';

const router = Router();

router.get('/:channelPoint', isAuthenticated, getBackup);
router.get('/restore/list', isAuthenticated, getRestoreList);
router.post('/verify/:channelPoint', isAuthenticated, postBackupVerify);
router.post('/restore/:channelPoint', isAuthenticated, postRestore);

export default router;
