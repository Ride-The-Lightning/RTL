import * as exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listInvoices, getInvoice, createInvoice } from '../../controllers/eclair/invoices.js';
const router = Router();
router.get('/', isAuthenticated, listInvoices);
router.get('/:paymentHash', isAuthenticated, getInvoice);
router.post('/', isAuthenticated, createInvoice);
export default router;
