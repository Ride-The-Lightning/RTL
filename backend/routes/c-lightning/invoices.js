import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listInvoices, addInvoice, deleteExpiredInvoice } from '../../controllers/c-lightning/invoices.js';
const router = Router();
router.get('/', isAuthenticated, listInvoices);
router.post('/', isAuthenticated, addInvoice);
router.delete('/', isAuthenticated, deleteExpiredInvoice);
export default router;
