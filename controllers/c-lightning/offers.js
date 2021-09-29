const offerStore = require('../../database/db');
var common = require('../../routes/common');
var logger = require('../shared/logger');

exports.getOffers = (req, res, next) => {
  try {
    offerStore.find({}, function (err, allOffers) {
      if (err) {
        const errResp = common.handleError(err, 'Offers', 'Get Offers Error');
        return res.status(500).json({ message: errResp.message, error: errResp.error });
      } else {
        logger.log({ level: 'DEBUG', fileName: 'Offers', msg: 'Get Offers Response', data: allOffers });
        return res.status(200).json(allOffers);
      }
    });
  } catch (err) {
    const errResp = common.handleError(err, 'Offers', 'Get Offers Error');
    return res.status(500).json({ message: errResp.message, error: errResp.error });
  }
};

exports.getOffer = (req, res, next) => {
  const idRequested = req.params.id
  try {
    offerStore.findOne({ _id: idRequested }, function (err, offerRequested) {
      if (err) {
        const errResp = common.handleError(err, 'Offers', 'Get Offer Error');
        return res.status(500).json({ message: errResp.message, error: errResp.error });
      } else {
        logger.log({ level: 'DEBUG', fileName: 'db.json', msg: 'Get Offer Response', data: offerRequested });
        return res.status(200).json(offerRequested);
      }
    });
  } catch (err) {
    const errResp = common.handleError(err, 'Offers', 'Get Offer Error');
    return res.status(500).json({ message: errResp.message, error: errResp.error });
  }
};

exports.saveOffer = (req, res, next) => {
  const offerToSave = { alias: req.body.alias, invoice: req.body.invoice };
  try {
    offerStore.insert(offerToSave)
    logger.log({ level: 'DEBUG', fileName: 'Offers', msg: 'Offer Saved', data: offerToSave });
    res.status(200).send({ message: "Offer saved successfully" });
  } catch (err) {
    const errResp = common.handleError(err, 'Offers', 'Save Offer Error');
    return res.status(500).json({ message: errResp.message, error: errResp.error });
  }
};

exports.updateOffer = (req, res, next) => {
  const updatedOffer = {
    _id: req.body.id,
    alias: req.body.alias,
    invoice: req.body.invoice
  };
  try {
    offerStore.update({ _id: req.body.id }, { $set: updatedOffer }, { multi: false })
    logger.log({ level: 'DEBUG', fileName: 'Offers', msg: 'Offer Update', data: updatedOffer });
    res.status(200).send({ message: "Offer updated successfully" });
  } catch (err) {
    const errResp = common.handleError(err, 'Offers', 'Update Offer Error');
    return res.status(500).json({ message: errResp.message, error: errResp.error });
  }
};

exports.deleteOffer = (req, res, next) => {
  try {
    offerStore.remove({ _id: req.params.id }, {})
    logger.log({ level: 'DEBUG', fileName: 'Offers', msg: 'Offer Deleted', data: { id: req.params.id } });
    res.status(200).json({ message: "Offer deleted successfully" });
  } catch (err) {
    const errResp = common.handleError(err, 'Offers', 'Delete Offer Error');
    return res.status(500).json({ message: errResp.message, error: errResp.error });
  }
};
