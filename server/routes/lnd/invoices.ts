import * as exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listInvoices, invoiceLookup, addInvoice } from '../../controllers/lnd/invoices.js';

const router = Router();

router.get('/', isAuthenticated, listInvoices);
router.get('/lookup/', isAuthenticated, invoiceLookup);
router.post('/', isAuthenticated, addInvoice);

export default router;
