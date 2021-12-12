import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import { listPaidOffers, deletePaidOffer, listOffers, disableOffer, createOffer, fetchOfferInvoice } from '../../controllers/c-lightning/offers.js';

const router = Router();

router.get('/paidoffers', isAuthenticated, listPaidOffers);
router.delete('/paidoffer/:offerUUID', isAuthenticated, deletePaidOffer);

router.get('/', isAuthenticated, listOffers);
router.post('/', isAuthenticated, createOffer);
router.post('/fetchOfferInvoice', isAuthenticated, fetchOfferInvoice);
router.delete('/:offerID', isAuthenticated, disableOffer);

export default router;
