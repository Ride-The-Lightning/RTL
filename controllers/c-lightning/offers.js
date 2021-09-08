const Offers = require('../../models/offer.schema');
var common = require('../../routes/common');
var logger = require('../shared/logger');

exports.getOffers = (req, res, next) => {
  Offers.find().then(records => {
    logger.log({level: 'DEBUG', fileName: 'Offers', msg: 'Get Offers Response', data: records});
    res.status(200).json(records);
  }).catch((errRes) => {
    const err = common.handleError(errRes,  'Offers', 'Get Offers Error'); // ?? Need to check err obj
    return res.status(500).json({message: err.message, error: err.error}); 
  });
};

exports.getOffer = (req, res, next) => {
  Offers.findById(req.params.id).then(offerByID => {
    if (offerByID) {
      logger.log({level: 'DEBUG', fileName: 'Offers', msg: 'Get Offer by ID Response', data: offerByID});
      res.status(200).json(offerByID);
    } else {
      const errRes = { message: 'Offer not found.', error: 'Offer with ID ' + req.params.id + ' not found' };
      const err = common.handleError(errRes,  'Offers', 'Get Offer by ID Error');
      res.status(404).json(err);
    }
  }).catch((errRes) => {
    const err = common.handleError(errRes,  'Offers', 'Get Offer by ID Error'); // ?? Need to check err obj
    return res.status(500).json({message: err.message, error: err.error}); 
  });
};

exports.saveOffer = (req, res, next) => {
  const offerToSave = new Offers({ alias: req.body.alias, invoice: req.body.invoice });
  logger.log({level: 'DEBUG', fileName: 'Offers', msg: 'Offer To Save', data: offerToSave});
  offerToSave.save().then(createdOffer => {
    logger.log({level: 'DEBUG', fileName: 'Offers', msg: 'Offer Saved', data: createdOffer});
    res.status(201).json({ ...createdOffer, id: createdOffer._id });
  }).catch((errRes) => {
    const err = common.handleError(errRes,  'Offers', 'Save Offer Error'); // ?? Need to check err obj
    return res.status(500).json({message: err.message, error: err.error});  // Response status
  });
};

exports.updateOffer = (req, res, next) => {
  const offerToUpdate = new Offers({
    _id: req.body.id,
    alias: req.body.alias,
    invoice: req.body.invoice
  });
  logger.log({level: 'DEBUG', fileName: 'Offers', msg: 'Offer To Update', data: offerToUpdate});
  Offers.updateOne({ _id: req.params.id }, offerToUpdate).then(response => {
    logger.log({level: 'DEBUG', fileName: 'Offers', msg: 'Offer Updated Successfully', data: response});
    res.status(200).json({ message: 'Offer Updated Successfully.' }); // Response status
  }).catch((errRes) => {
    const err = common.handleError(errRes,  'Offers', 'Update Offer Error'); // ?? Need to check err obj
    return res.status(500).json({message: err.message, error: err.error}); 
  });
};

exports.deleteOffer = (req, res, next) => {
  Offers.deleteOne({ _id: req.params.id }).then(deleteRes => {
    logger.log({level: 'DEBUG', fileName: 'Offers', msg: 'Delete Offer Response', data: deleteRes});
    res.status(200).json({ message: 'Offer Deleted.' });
  }).catch((errRes) => {
    const err = common.handleError(errRes,  'Offers', 'Delete Offer Error'); // ?? Need to check err obj
    return res.status(500).json({message: err.message, error: err.error}); 
  });
};
