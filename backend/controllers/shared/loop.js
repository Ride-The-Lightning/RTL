import request from '../../utils/request.js';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const loopOut = (req, res, next) => {
    const { amount, targetConf, swapRoutingFee, minerFee, prepayRoutingFee, prepayAmt, swapFee, swapPublicationDeadline, chanId, destAddress } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Looping Out..' });
    options.uri = '/v1/loop/out';
    options.body = {
        amt: amount,
        sweep_conf_target: targetConf,
        max_swap_routing_fee: swapRoutingFee,
        max_miner_fee: minerFee,
        max_prepay_routing_fee: prepayRoutingFee,
        max_prepay_amt: prepayAmt,
        max_swap_fee: swapFee,
        swap_publication_deadline: swapPublicationDeadline,
        initiator: 'RTL'
    };
    if (chanId !== '') {
        options.body['loop_out_channel'] = chanId;
    }
    if (destAddress !== '') {
        options.body['dest'] = destAddress;
    }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Body', data: options.body });
    request.post(options).then((loopOutRes) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Looped Out', data: loopOutRes });
        res.status(201).json(loopOutRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop Out Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopOutTerms = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Terms..' });
    options.uri = '/v1/loop/out/terms';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop Out Terms Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop Out Terms Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopOutQuote = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Quotes..' });
    const amountRaw = typeof req.params.amount === 'string' ? req.params.amount.trim() : '';
    if (amountRaw === '' || !(/^\d+$/).test(amountRaw)) {
        logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid amount path param' });
        return res.status(400).json({ message: 'amount must be a non-negative integer', error: 'Invalid path parameter' });
    }
    const amount = Number(amountRaw);
    if (!Number.isSafeInteger(amount)) {
        logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'amount exceeds safe integer range' });
        return res.status(400).json({ message: 'amount exceeds maximum safe integer', error: 'Invalid path parameter' });
    }
    const qs = {};
    if (req.query.targetConf !== undefined) {
        const raw = typeof req.query.targetConf === 'string' ? req.query.targetConf.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid targetConf query param' });
            return res.status(400).json({ message: 'targetConf must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'targetConf exceeds safe integer range' });
            return res.status(400).json({ message: 'targetConf exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.conf_target = num;
    }
    else {
        qs.conf_target = 2;
    }
    if (req.query.swapPublicationDeadline !== undefined) {
        const raw = typeof req.query.swapPublicationDeadline === 'string' ? req.query.swapPublicationDeadline.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid swapPublicationDeadline query param' });
            return res.status(400).json({ message: 'swapPublicationDeadline must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'swapPublicationDeadline exceeds safe integer range' });
            return res.status(400).json({ message: 'swapPublicationDeadline exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.swap_publication_deadline = num;
    }
    const reqOpts = { ...options, uri: '/v1/loop/out/quote/' + amount, qs };
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quote URL', data: reqOpts.uri });
    request(reqOpts).then((quoteRes) => {
        quoteRes.amount = amount;
        quoteRes.swap_payment_dest = quoteRes.swap_payment_dest ? Buffer.from(quoteRes.swap_payment_dest, 'base64').toString('hex') : '';
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop Out Quote Received', data: quoteRes });
        res.status(200).json(quoteRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop Out Quotes Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopOutTermsAndQuotes = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Terms & Quotes..' });
    const qs = {};
    if (req.query.targetConf !== undefined) {
        const raw = typeof req.query.targetConf === 'string' ? req.query.targetConf.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid targetConf query param' });
            return res.status(400).json({ message: 'targetConf must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'targetConf exceeds safe integer range' });
            return res.status(400).json({ message: 'targetConf exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.conf_target = num;
    }
    else {
        qs.conf_target = 2;
    }
    if (req.query.swapPublicationDeadline !== undefined) {
        const raw = typeof req.query.swapPublicationDeadline === 'string' ? req.query.swapPublicationDeadline.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid swapPublicationDeadline query param' });
            return res.status(400).json({ message: 'swapPublicationDeadline must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'swapPublicationDeadline exceeds safe integer range' });
            return res.status(400).json({ message: 'swapPublicationDeadline exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.swap_publication_deadline = num;
    }
    options.uri = '/v1/loop/out/terms';
    request(options).then((terms) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Terms Received', data: terms });
        const options1 = { ...options, uri: '/v1/loop/out/quote/' + terms.min_swap_amount, qs };
        const options2 = { ...options, uri: '/v1/loop/out/quote/' + terms.max_swap_amount, qs };
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Min Quote Options', data: options1 });
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Max Quote Options', data: options2 });
        return Promise.all([request(options1), request(options2)]).then((values) => {
            values[0].amount = +terms.min_swap_amount;
            values[1].amount = +terms.max_swap_amount;
            values[0].swap_payment_dest = values[0].swap_payment_dest ? Buffer.from(values[0].swap_payment_dest, 'base64').toString('hex') : '';
            values[1].swap_payment_dest = values[1].swap_payment_dest ? Buffer.from(values[1].swap_payment_dest, 'base64').toString('hex') : '';
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop Out Quotes 1 Received', data: values[0] });
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop Out Quotes 2 Received', data: values[1] });
            res.status(200).json(values);
        }).catch((errRes) => {
            const err = common.handleError(errRes, 'Loop', 'Loop Out Terms & Quotes Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop Out Terms & Quotes Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopIn = (req, res, next) => {
    const { amount, swapFee, minerFee } = req.body;
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Looping In..' });
    options.uri = '/v1/loop/in';
    options.body = {
        amt: amount,
        max_swap_fee: swapFee,
        max_miner_fee: minerFee,
        initiator: 'RTL'
    };
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop In Body', data: options.body });
    request.post(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Looped In', data: body });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop In Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopInTerms = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Terms..' });
    options.uri = '/v1/loop/in/terms';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop In Terms Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop In Terms Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopInQuote = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Quotes..' });
    const amountRaw = typeof req.params.amount === 'string' ? req.params.amount.trim() : '';
    if (amountRaw === '' || !(/^\d+$/).test(amountRaw)) {
        logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid amount path param' });
        return res.status(400).json({ message: 'amount must be a non-negative integer', error: 'Invalid path parameter' });
    }
    const amount = Number(amountRaw);
    if (!Number.isSafeInteger(amount)) {
        logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'amount exceeds safe integer range' });
        return res.status(400).json({ message: 'amount exceeds maximum safe integer', error: 'Invalid path parameter' });
    }
    const qs = {};
    if (req.query.targetConf !== undefined) {
        const raw = typeof req.query.targetConf === 'string' ? req.query.targetConf.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid targetConf query param' });
            return res.status(400).json({ message: 'targetConf must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'targetConf exceeds safe integer range' });
            return res.status(400).json({ message: 'targetConf exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.conf_target = num;
    }
    else {
        qs.conf_target = 2;
    }
    if (req.query.swapPublicationDeadline !== undefined) {
        const raw = typeof req.query.swapPublicationDeadline === 'string' ? req.query.swapPublicationDeadline.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid swapPublicationDeadline query param' });
            return res.status(400).json({ message: 'swapPublicationDeadline must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'swapPublicationDeadline exceeds safe integer range' });
            return res.status(400).json({ message: 'swapPublicationDeadline exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.swap_publication_deadline = num;
    }
    const reqOpts = { ...options, uri: '/v1/loop/in/quote/' + amount, qs };
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quote Options', data: reqOpts.uri });
    request(reqOpts).then((body) => {
        body.amount = amount;
        body.swap_payment_dest = body.swap_payment_dest ? Buffer.from(body.swap_payment_dest, 'base64').toString('hex') : '';
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop In Qoutes Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop In Quote Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopInTermsAndQuotes = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Terms & Quotes..' });
    const qs = {};
    if (req.query.targetConf !== undefined) {
        const raw = typeof req.query.targetConf === 'string' ? req.query.targetConf.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid targetConf query param' });
            return res.status(400).json({ message: 'targetConf must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'targetConf exceeds safe integer range' });
            return res.status(400).json({ message: 'targetConf exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.conf_target = num;
    }
    else {
        qs.conf_target = 2;
    }
    if (req.query.swapPublicationDeadline !== undefined) {
        const raw = typeof req.query.swapPublicationDeadline === 'string' ? req.query.swapPublicationDeadline.trim() : '';
        if (raw === '' || !(/^\d+$/).test(raw)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'Invalid swapPublicationDeadline query param' });
            return res.status(400).json({ message: 'swapPublicationDeadline must be a non-negative integer', error: 'Invalid query parameter' });
        }
        const num = Number(raw);
        if (!Number.isSafeInteger(num)) {
            logger.log({ selectedNode: req.session.selectedNode, level: 'WARN', fileName: 'Loop', msg: 'swapPublicationDeadline exceeds safe integer range' });
            return res.status(400).json({ message: 'swapPublicationDeadline exceeds maximum safe integer', error: 'Invalid query parameter' });
        }
        qs.swap_publication_deadline = num;
    }
    options.uri = '/v1/loop/in/terms';
    request(options).then((terms) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Terms Received', data: terms });
        const options1 = { ...options, uri: '/v1/loop/in/quote/' + terms.min_swap_amount, qs };
        const options2 = { ...options, uri: '/v1/loop/in/quote/' + terms.max_swap_amount, qs };
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Min Quote Options', data: options1 });
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Max Quote Options', data: options2 });
        return Promise.all([request(options1), request(options2)]).then((values) => {
            values[0].amount = +terms.min_swap_amount;
            values[1].amount = +terms.max_swap_amount;
            values[0].swap_payment_dest = values[0].swap_payment_dest ? Buffer.from(values[0].swap_payment_dest, 'base64').toString('hex') : '';
            values[1].swap_payment_dest = values[1].swap_payment_dest ? Buffer.from(values[1].swap_payment_dest, 'base64').toString('hex') : '';
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop In Quotes 1 Received', data: values[0] });
            logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop In Quotes 2 Received', data: values[1] });
            res.status(200).json(values);
        }).catch((errRes) => {
            const err = common.handleError(errRes, 'Loop', 'Loop In Terms & Quotes Error', req.session.selectedNode);
            return res.status(err.statusCode).json({ message: err.message, error: err.error });
        });
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop In Terms & Quotes Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const swaps = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting List Swaps..' });
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'List Swaps Error', error: errMsg }, 'Loop', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.uri = '/v1/loop/swaps';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Swaps Received', data: body });
        res.status(200).json(body.swaps);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'List Swaps Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const swap = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Swap Information..' });
    options.uri = '/v1/loop/swap/' + req.params.id;
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop Swap Information Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Get Swap Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopInfo = (req, res, next) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Information..' });
    options = common.setSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Loop Info Error', error: errMsg }, 'Loop', errMsg, req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.uri = '/v1/loop/info';
    request(options).then((body) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop Information Received', data: body });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Get Loop Info Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
