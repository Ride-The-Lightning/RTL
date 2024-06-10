import request from 'request-promise';
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
    options.uri = '/v1/loop/out/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quote URL', data: options.url });
    request(options).then((quoteRes) => {
        quoteRes.amount = +req.params.amount;
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
    options.uri = '/v1/loop/out/terms';
    request(options).then((terms) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Terms Received', data: terms });
        const options1 = options;
        const options2 = options;
        options1.uri = '/v1/loop/out/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
        options2.uri = '/v1/loop/out/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
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
    options.uri = '/v1/loop/in/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quote Options', data: options.url });
    request(options).then((body) => {
        body.amount = +req.params.amount;
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
    options.uri = '/v1/loop/in/terms';
    request(options).then((terms) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Terms Received', data: terms });
        const options1 = options;
        const options2 = options;
        options1.uri = '/v1/loop/in/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
        options2.uri = '/v1/loop/in/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
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
