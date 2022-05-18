import exprs from 'express';
const { Router } = exprs;
import { isAuthenticated } from '../../utils/authCheck.js';
import {
  listOfferBookmarks,
  deleteOfferBookmark,
  listOffers,
  disableOffer,
  createOffer,
  fetchOfferInvoice
} from '../../controllers/cln/offers.js';

const router = Router();

router.get('/offerbookmarks', isAuthenticated, listOfferBookmarks);
router.delete('/offerbookmark/:offerStr', isAuthenticated, deleteOfferBookmark);

router.get('/', isAuthenticated, listOffers);
router.post('/', isAuthenticated, createOffer);
router.post('/fetchOfferInvoice', isAuthenticated, fetchOfferInvoice);
router.delete('/:offerID', isAuthenticated, disableOffer);

export default router;
