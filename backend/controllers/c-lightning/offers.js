import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
import { Database } from '../../utils/database.js';
let options = null;
const logger = Logger;
const common = Common;
const DB = Database;
export const listPaidOffers = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Getting Paid Offers..' });
    DB.rtlDB.offer.findAll().then((offers) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Paid Offers List Received', data: offers });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Paid Offers Received' });
        res.status(200).json(offers);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Offers', 'List Paid Offers Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const deletePaidOffer = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Deleting Paid Offer..' });
    DB.rtlDB.offer.destroy({ where: { id: req.params.offerUUID } }).then((deleteRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Offers', msg: 'Paid Offer Deleted', data: deleteRes });
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Paid Offer Deleted' });
        res.status(204).json({ id: req.params.offerUUID });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Offers', 'Paid Offer Delete Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listOffers = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Offers', msg: 'Getting Offers..' });
    options = common.getOptions(req);
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
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
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
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
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
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
    if (options.error) {
        return res.status(options.statusCode).json({ message: options.message, error: options.error });
    }
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
