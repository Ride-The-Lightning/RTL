import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { Database, DatabaseService } from '../../utils/database.js';
import { CollectionFieldsEnum, CollectionsEnum, Offer } from '../../models/database.model.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
const databaseService: DatabaseService = Database;

export const listOfferBookmarks = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Getting Offer Bookmarks..' });
  databaseService.find(req.session.selectedNode, CollectionsEnum.OFFERS).then((offers: any) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Bookmarks Received', data: offers });
    res.status(200).json(offers);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offers', 'Offer Bookmarks Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const deleteOfferBookmark = (req, res, next) => {
  const { offer_str } = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Deleting Offer Bookmark..' });
  databaseService.remove(req.session.selectedNode, CollectionsEnum.OFFERS, CollectionFieldsEnum.BOLT12, offer_str).then((deleteRes) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Bookmark Deleted', data: deleteRes });
    res.status(204).json(offer_str);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offers', 'Offer Bookmark Delete Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listOffers = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Getting Offers..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listoffers';
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Offers List URL', data: options.url });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offers List Received', data: body });
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
  options.url = req.session.selectedNode.ln_server_url + '/v1/offer';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Created', data: body });
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
  options.url = req.session.selectedNode.ln_server_url + '/v1/fetchinvoice';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Offer Invoice Body', data: options.body });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Invoice Received', data: body });
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
  options.url = req.session.selectedNode.ln_server_url + '/v1/disableOffer';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Offer Disabled', data: body });
    res.status(202).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Offers', 'Disable Offer Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
