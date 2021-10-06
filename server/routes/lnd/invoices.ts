import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { listInvoices, getInvoice, addInvoice } from '../../controllers/lnd/invoices';

const router = Router();

router.get('/', isAuthenticated, listInvoices);
router.get('/:rHashStr', isAuthenticated, getInvoice);
router.post('/', isAuthenticated, addInvoice);

export default router;
