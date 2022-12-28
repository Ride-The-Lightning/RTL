import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getRTLConfigInitial, getRTLConfig, updateUISettings, update2FASettings, getConfig, getFile, updateSelectedNode, updateDefaultNode, updateServiceSettings, updateSSO, getCurrencyRates } from '../../controllers/shared/RTLConf.js';

const router = Router();

router.get('/rtlconfinit', getRTLConfigInitial);
router.get('/rtlconf', isAuthenticated, getRTLConfig);
router.post('/', isAuthenticated, updateUISettings);
router.post('/update2FA', isAuthenticated, update2FASettings);
router.get('/config/:nodeType', isAuthenticated, getConfig);
router.get('/file', isAuthenticated, getFile);
router.get('/updateSelNode/:currNodeIndex/:prevNodeIndex', updateSelectedNode);
router.post('/updateDefaultNode', updateDefaultNode);
router.post('/updateServiceSettings', updateServiceSettings);
router.post('/updateSSO', updateSSO);
router.get('/rates', getCurrencyRates);

export default router;
