import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { database } from '../../utils/database.init.js';
import { uuid } from 'uuidv4';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getOffers = async (req, res, next) => {
  try {
    const allOffers = await database.offer.findAll();
    logger.log({ level: 'DEBUG', fileName: 'Offer', msg: 'Get Offers Response', data: allOffers });
    return res.status(200).json(allOffers);
  } catch (errRes) {
    const err = common.handleError(errRes, 'Offer', 'Get Offers Error');
    return res.status(500).json({ message: err.message, error: err.error });
  }
};

export const getOffer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const offer = await database.offer.findOne({ where: { id } });
    if (offer) {
      logger.log({ level: 'DEBUG', fileName: 'Offer', msg: 'Get Offer Response', data: offer });
      return res.status(200).json(offer);
    } else {
      logger.log({ level: 'ERROR', fileName: 'Offer', msg: 'Offer Not Found', data: { offerId: id } });
      return res.sendStatus(404);
    }
  } catch (errRes) {
    const err = common.handleError(errRes, 'Offer', 'Get Offer Error');
    return res.status(500).json({ message: err.message, error: err.error });
  }
};

export const saveOffer = async (req, res, next) => {
  try {
    const offer = req.body;
    offer.id = uuid();
    const savedOffer = await database.offer.create(offer);
    logger.log({ level: 'DEBUG', fileName: 'Offer', msg: 'Offer Saved', data: savedOffer });
    res.status(201).json(savedOffer);
  } catch (errRes) {
    const err = common.handleError(errRes, 'Offer', 'Save Offer Error');
    return res.status(500).json({ message: err.message, error: err.error });
  }
};

export const updateOffer = async (req, res, next) => {
  try {
    const obj = req.body;
    const offerObj = await database.offer.findOne({ where: { id: obj.id } });
    if (offerObj) {
      offerObj.alias = obj.alias;
      offerObj.offerString = obj.offerString;
      offerObj.save();
      logger.log({ level: 'DEBUG', fileName: 'Offer', msg: 'Offer Update', data: offerObj });
      res.status(200).json(offerObj);
    } else {
      logger.log({ level: 'ERROR', fileName: 'Offer', msg: 'Offer Not Found', data: obj });
      return res.sendStatus(404);
    }
  } catch (errRes) {
    const err = common.handleError(errRes, 'Offer', 'Update Offer Error');
    return res.status(500).json({ message: err.message, error: err.error });
  }
};

export const deleteOffer = async (req, res, next) => {
  try {
    const id = req.params.id;
    const flag = await database.offer.destroy({ where: { id } });
    if (flag) {
      logger.log({ level: 'DEBUG', fileName: 'Offer', msg: 'Offer Deleted', data: { offerId: id } });
      return res.sendStatus(200);
    } else {
      logger.log({ level: 'ERROR', fileName: 'Offer', msg: 'Offer Not Found', data: { offerId: id } });
      return res.sendStatus(404);
    }
  } catch (errRes) {
    const err = common.handleError(errRes, 'Offers', 'Delete Offer Error');
    return res.status(500).json({ message: err.message, error: err.error });
  }
};


export const decodePayment = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'Offer', msg: 'Decoding Payment..' });
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/utility/decode/' + req.params.invoice;
  request(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Offer', msg: 'Payment Decode Received', data: body });
    logger.log({ level: 'INFO', fileName: 'Offer', msg: 'Payment Decoded' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offer', 'Decode Payment Error');
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};


export const fetchInvoice = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'Offer', msg: 'Fetching Invoice..' });
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/offers/fetchInvoice';
  options.method = 'POST';
  options.body = req.body;
  console.log(options, "--------\n")
  request(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Offer', msg: 'Invoice Received', data: body });
    logger.log({ level: 'INFO', fileName: 'Offer', msg: 'Invoice Received' });
    res.status(200).json(body)
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offer', 'Fetch Invoice Error');
    return res.status(err.statusCode).json({ message: err.message, error: err.error })
  })
}
