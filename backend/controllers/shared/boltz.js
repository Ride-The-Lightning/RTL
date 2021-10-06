"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deposit = exports.createChannel = exports.createReverseSwap = exports.createSwap = exports.getSwapInfo = exports.listSwaps = exports.getServiceInfo = exports.getInfo = void 0;
const request = require("request-promise");
const logger_1 = require("../../utils/logger");
const common_1 = require("../../utils/common");
let options = null;
const logger = logger_1.Logger;
const common = common_1.Common;
const getInfo = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Getting Boltz Information..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Info Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/info';
    request(options).then((body) => {
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Boltz Information Received' });
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz Get Info', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Get Info Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getInfo = getInfo;
const getServiceInfo = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Getting Service Information..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Service Information Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/serviceinfo';
    request(options).then((body) => {
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Service Information Received' });
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz Get Service Info', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Get Service Information Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getServiceInfo = getServiceInfo;
const listSwaps = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Getting List Swaps..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'List Swaps Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/listswaps';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz List Swaps Info', data: body });
        if (body && body.swaps && body.swaps.length && body.swaps.length > 0) {
            body.swaps = body.swaps.reverse();
        }
        if (body && body.reverseSwaps && body.reverseSwaps.length && body.reverseSwaps.length > 0) {
            body.reverseSwaps = body.reverseSwaps.reverse();
        }
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'List Swaps Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'List Swaps Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.listSwaps = listSwaps;
const getSwapInfo = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Getting Swap..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Swap Information Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/swap/' + req.params.swapId;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Boltz Swap Info', data: body });
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Swap Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Swap Info Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.getSwapInfo = getSwapInfo;
const createSwap = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Creating Swap..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Create Swap Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/createswap';
    options.body = { amount: req.body.amount };
    if (req.body.address !== '') {
        options.body.address = req.body.address;
    }
    logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Create Swap Body', data: options.body });
    request.post(options).then(createSwapRes => {
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Create Swap Response', data: createSwapRes });
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Swap Created' });
        res.status(201).json(createSwapRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Create Swap Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.createSwap = createSwap;
const createReverseSwap = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Creating Reverse Swap..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Create Reverse Swap Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/createreverseswap';
    options.body = { amount: req.body.amount };
    if (req.body.address !== '') {
        options.body.address = req.body.address;
    }
    logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Create Reverse Swap Body', data: options.body });
    request.post(options).then(createReverseSwapRes => {
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Create Reverse Swap Response', data: createReverseSwapRes });
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Reverse Swap Created' });
        res.status(201).json(createReverseSwapRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Create Reverse Swap Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.createReverseSwap = createReverseSwap;
const createChannel = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Creating Boltz Channel..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Create Channel Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/createchannel';
    options.body = { amount: req.body.amount };
    if (req.body.address !== '') {
        options.body.address = req.body.address;
    }
    logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Create Channel Body', data: options.body });
    request.post(options).then(createChannelRes => {
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Create Channel Response', data: createChannelRes });
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Boltz Channel Created' });
        res.status(201).json(createChannelRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Create Channel Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.createChannel = createChannel;
const deposit = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Boltz Deposit Start..' });
    options = common.getBoltzServerOptions();
    if (options.url === '') {
        const errMsg = 'Boltz Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Deposit Error', error: errMsg }, 'Boltz', errMsg);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/deposit';
    request.post(options).then(depositRes => {
        logger.log({ level: 'DEBUG', fileName: 'Boltz', msg: 'Deposit Response', data: depositRes });
        logger.log({ level: 'INFO', fileName: 'Boltz', msg: 'Boltz Deposit Finished' });
        res.status(201).json(depositRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Boltz', 'Deposit Error');
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
exports.deposit = deposit;
