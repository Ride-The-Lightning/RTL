import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { getRTLConfig, updateNodeSettings, getConfig, getFile, updateSelectedNode, updateApplicationSettings, getCurrencyRates } from '../../controllers/shared/RTLConf.js';

const router = Router();

router.get('/rates', getCurrencyRates);
router.get('/file', isAuthenticated, getFile);
router.get('/rtlconf/:init', isAuthenticated, getRTLConfig);
router.get('/updateSelNode/:currNodeIndex/:prevNodeIndex', updateSelectedNode);
router.get('/config/:nodeType', isAuthenticated, getConfig);
router.post('/node', isAuthenticated, updateNodeSettings);
router.post('/application', isAuthenticated, updateApplicationSettings);

export default router;
