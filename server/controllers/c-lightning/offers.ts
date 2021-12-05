import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const listOffers = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Getting Offers..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/offers/listoffers';
  if (req.query.offer_id) {
    options.url = options.url + '?offer_id=' + req.query.offer_id;
  }
  if (req.query.active_only) {
    options.url = options.url + '?active_only=' + req.query.active_only;
  }
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Offers List URL', data: options.url });
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Offers List Received', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offers Received' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offers', 'List Offers Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const createOffer = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Creating Offer..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/offers/offer';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offer', msg: 'Add Offer Response', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Created' });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offer', 'Create Offer Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const fetchOfferInvoice = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Getting Offer Invoice..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/offers/fetchInvoice';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Offer Invoice Body', data: options.body });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Offer Invoice Received', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Invoice Received' });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offers', 'Get Offer Invoice Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const disableOffer = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Disabling Offer..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/offers/disableOffer/' + req.params.offerID;
  request.delete(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Offer Disabled', data: body });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Disabled' });
    res.status(202).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offers', 'Disable Offer Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
