import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listInvoices, addInvoice, deleteExpiredInvoice } from '../../controllers/cln/invoices.js';
const router = Router();
router.post('/lookup/', isAuthenticated, listInvoices);
router.post('/', isAuthenticated, addInvoice);
router.post('/delete/', isAuthenticated, deleteExpiredInvoice);
export default router;
