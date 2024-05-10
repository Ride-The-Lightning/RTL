import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { updateNodeSettings, getConfig, getFile, updateSelectedNode, updateApplicationSettings, getCurrencyRates, getApplicationSettings,
  getExplorerFeesRecommended, getExplorerTransaction } from '../../controllers/shared/RTLConf.js';

const router = Router();

router.get('/', getApplicationSettings);
router.get('/rates', getCurrencyRates);
router.get('/file', isAuthenticated, getFile);
router.get('/updateSelNode/:currNodeIndex/:prevNodeIndex', updateSelectedNode);
router.get('/config/:nodeType', isAuthenticated, getConfig);
router.post('/node', isAuthenticated, updateNodeSettings);
router.post('/application', isAuthenticated, updateApplicationSettings);
router.get('/explorerFeesRecommended', getExplorerFeesRecommended);
router.get('/explorerTransaction/:txid', getExplorerTransaction);

export default router;
