import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listInvoices, getInvoice, addInvoice } from '../../controllers/lnd/invoices.js';

const router = Router();

router.get('/', isAuthenticated, listInvoices);
router.get('/:rHashStr', isAuthenticated, getInvoice);
router.post('/', isAuthenticated, addInvoice);

export default router;
