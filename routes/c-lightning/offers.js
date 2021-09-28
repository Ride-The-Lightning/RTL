const OffersController = require('../../controllers/c-lightning/offers');
const express = require('express');
const router = express.Router();
const authCheck = require('../shared/authCheck');

router.get('/', authCheck, OffersController.getOffers);
router.get('/offer/:id', authCheck, OffersController.getOffer);
router.post('/', authCheck, OffersController.saveOffer);
router.put('/', authCheck, OffersController.updateOffer);
router.delete('/:id', authCheck, OffersController.deleteOffer);

module.exports = router;
