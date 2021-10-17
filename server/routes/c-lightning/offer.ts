import { Router } from 'express';
import { isAuthenticated } from '../../utils/authCheck.js';
import { getOffer, getOffers, updateOffer, deleteOffer, saveOffer } from '../../controllers/c-lightning/offer.js';

const router = Router();

router.get('/', isAuthenticated, getOffers);
router.get('/:id', isAuthenticated, getOffer);
router.post('/', isAuthenticated, saveOffer);
router.put('/', isAuthenticated, updateOffer);
router.delete('/:id', isAuthenticated, deleteOffer)

export default router;