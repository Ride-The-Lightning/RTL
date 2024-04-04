import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const getInfo = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Getting Boltz Information..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Info Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/info';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Boltz Information Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Get Info Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getServiceInfo = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Getting Service Information..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Service Information Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/serviceinfo';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Boltz Get Service Info Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Get Service Information Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const listSwaps = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Getting List Swaps..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'List Swaps Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/listswaps';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Boltz List Swaps Received', data: body });
        if (body && body.swaps && body.swaps.length && body.swaps.length > 0) {
            body.swaps = body.swaps.reverse();
        }
        if (body && body.reverseSwaps && body.reverseSwaps.length && body.reverseSwaps.length > 0) {
            body.reverseSwaps = body.reverseSwaps.reverse();
        }
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'List Swaps Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const getSwapInfo = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Getting Swap Information..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Swap Information Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/swap/' + req.params.swapId;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Swap Information Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Swap Info Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const createSwap = (req, res, next) => {
    const { amount, sendFromInternal, address } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Creating Swap..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Create Swap Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/createswap';
    options.body = { amount: amount };
    if (sendFromInternal) {
        options.body.send_from_internal = sendFromInternal;
    }
    if (address && address !== '') {
        options.body.address = address;
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Boltz', msg: 'Create Swap Options Body', data: options.body });
    request.post(options).then((createSwapRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Swap Created', data: createSwapRes });
        res.status(201).json(createSwapRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Create Swap Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const createReverseSwap = (req, res, next) => {
    const { amount, acceptZeroConf, address } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Creating Reverse Swap..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Create Reverse Swap Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/createreverseswap';
    options.body = { amount: amount, accept_zero_conf: acceptZeroConf || false };
    if (address && address !== '') {
        options.body.address = address;
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Boltz', msg: 'Create Reverse Swap Body', data: options.body });
    request.post(options).then((createReverseSwapRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Reverse Swap Created', data: createReverseSwapRes });
        res.status(201).json(createReverseSwapRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Create Reverse Swap Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const createChannel = (req, res, next) => {
    const { amount, address } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Creating Boltz Channel..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Create Channel Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/createchannel';
    options.body = { amount: amount };
    if (address && address !== '') {
        options.body.address = address;
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Boltz', msg: 'Create Channel Options Body', data: options.body });
    request.post(options).then((createChannelRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Boltz Channel Created', data: createChannelRes });
        res.status(201).json(createChannelRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Create Channel Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const deposit = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Boltz Deposit Start..' });
    options = common.getBoltzServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Deposit Error', error: errMsg }, 'Boltz', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/deposit';
    request.post(options).then((depositRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Boltz', msg: 'Boltz Deposit Finished', data: depositRes });
        res.status(201).json(depositRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Deposit Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
