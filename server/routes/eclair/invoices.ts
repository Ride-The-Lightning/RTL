import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck';
import { listInvoices, getInvoice, createInvoice } from '../../controllers/eclair/invoices';

const router = Router();

router.get('/', isAuthenticated, listInvoices);
router.get('/:paymentHash', isAuthenticated, getInvoice);
router.post('/', isAuthenticated, createInvoice);

export default router;
