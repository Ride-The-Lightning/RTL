import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { updateNodeSettings, getConfig, getFile, updateSelectedNode, updateApplicationSettings, getCurrencyRates, getApplicationSettings,
  getExplorerFeesRecommended, getExplorerTransaction } from '../../controllers/shared/RTLConf.js';

const router = Router();

router.get('/', getApplicationSettings);
router.get('/rates', getCurrencyRates);
router.get('/file', isAuthenticated, getFile);
// A POST, so the CSRF check applies: selecting a node changes what the session works on.
router.post('/updateSelNode/:currNodeIndex/:prevNodeIndex', isAuthenticated, updateSelectedNode);
router.get('/config/:nodeType', isAuthenticated, getConfig);
router.post('/node', isAuthenticated, updateNodeSettings);
router.post('/application', isAuthenticated, updateApplicationSettings);
router.get('/explorerFeesRecommended', isAuthenticated, getExplorerFeesRecommended);
router.get('/explorerTransaction/:txid', isAuthenticated, getExplorerTransaction);

export default router;
