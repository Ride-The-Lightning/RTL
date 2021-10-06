import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { listInvoices, addInvoice, deleteExpiredInvoice } from '../../controllers/c-lightning/invoices';

const router = Router();

router.get('/', isAuthenticated, listInvoices);
router.post('/', isAuthenticated, addInvoice);
router.delete('/', isAuthenticated, deleteExpiredInvoice);

export default router;
