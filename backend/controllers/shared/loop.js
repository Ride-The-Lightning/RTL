import request from 'request-promise';
import { Logger } from '../../utils/logger.js';
import { Common } from '../../utils/common.js';
let options = null;
const logger = Logger;
const common = Common;
export const loopOut = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Looping Out..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop Out Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/out';
    options.body = {
        amt: req.body.amount,
        sweep_conf_target: req.body.targetConf,
        max_swap_routing_fee: req.body.swapRoutingFee,
        max_miner_fee: req.body.minerFee,
        max_prepay_routing_fee: req.body.prepayRoutingFee,
        max_prepay_amt: req.body.prepayAmt,
        max_swap_fee: req.body.swapFee,
        swap_publication_deadline: req.body.swapPublicationDeadline,
        initiator: 'RTL'
    };
    if (req.body.chanId !== '') {
        options.body['loop_out_channel'] = req.body.chanId;
    }
    if (req.body.destAddress !== '') {
        options.body['dest'] = req.body.destAddress;
    }
    logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Body', data: options.body });
    request.post(options).then((loopOutRes) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out', data: loopOutRes });
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop Out Finished' });
        res.status(201).json(loopOutRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop Out Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopOutTerms = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Terms..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop Out Terms Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/out/terms';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Terms', data: body });
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop Out Terms Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop Out Terms Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopOutQuote = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Quotes..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop Out Quotes Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/out/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quote URL', data: options.url });
    request(options).then((quoteRes) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quote', data: quoteRes });
        quoteRes.amount = +req.params.amount;
        quoteRes.swap_payment_dest = quoteRes.swap_payment_dest ? Buffer.from(quoteRes.swap_payment_dest, 'base64').toString('hex') : '';
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop Out Quotes Received' });
        res.status(200).json(quoteRes);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop Out Quotes Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopOutTermsAndQuotes = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting Loop Out Terms & Quotes..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop Out Terms & Quotes Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/out/terms';
    request(options).then((terms) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Terms', data: terms });
        const options1 = common.getSwapServerOptions(req);
        const options2 = common.getSwapServerOptions(req);
        options1.url = options1.url + '/v1/loop/out/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
        options2.url = options2.url + '/v1/loop/out/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Min Quote Options', data: options1 });
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Max Quote Options', data: options2 });
        return Promise.all([request(options1), request(options2)]).then((values) => {
            values[0].amount = +terms.min_swap_amount;
            values[1].amount = +terms.max_swap_amount;
            values[0].swap_payment_dest = values[0].swap_payment_dest ? Buffer.from(values[0].swap_payment_dest, 'base64').toString('hex') : '';
            values[1].swap_payment_dest = values[1].swap_payment_dest ? Buffer.from(values[1].swap_payment_dest, 'base64').toString('hex') : '';
            logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quotes 1', data: values[0] });
            logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quotes 2', data: values[1] });
            logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop Out Terms & Quotes Received' });
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
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Looping In..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop In Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/in';
    options.body = {
        amt: req.body.amount,
        max_swap_fee: req.body.swapFee,
        max_miner_fee: req.body.minerFee,
        initiator: 'RTL'
    };
    logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Body', data: options.body });
    request.post(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In', data: body });
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop In Finished' });
        res.status(201).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop In Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopInTerms = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Terms..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop In Terms Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/in/terms';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Terms', data: body });
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop In Terms Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop In Terms Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopInQuote = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Quotes..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop In Quotes Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/in/quote/' + req.params.amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
    logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quote Options', data: options.url });
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quote', data: body });
        body.amount = +req.params.amount;
        body.swap_payment_dest = body.swap_payment_dest ? Buffer.from(body.swap_payment_dest, 'base64').toString('hex') : '';
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop In Qoutes Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Loop In Quote Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const loopInTermsAndQuotes = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting Loop In Terms & Quotes..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Loop In Terms & Quotes Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/in/terms';
    request(options).then((terms) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Terms', data: terms });
        const options1 = common.getSwapServerOptions(req);
        const options2 = common.getSwapServerOptions(req);
        options1.url = options1.url + '/v1/loop/in/quote/' + terms.min_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
        options2.url = options2.url + '/v1/loop/in/quote/' + terms.max_swap_amount + '?conf_target=' + (req.query.targetConf ? req.query.targetConf : '2') + '&swap_publication_deadline=' + req.query.swapPublicationDeadline;
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Min Quote Options', data: options1 });
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Max Quote Options', data: options2 });
        return Promise.all([request(options1), request(options2)]).then((values) => {
            values[0].amount = +terms.min_swap_amount;
            values[1].amount = +terms.max_swap_amount;
            values[0].swap_payment_dest = values[0].swap_payment_dest ? Buffer.from(values[0].swap_payment_dest, 'base64').toString('hex') : '';
            values[1].swap_payment_dest = values[1].swap_payment_dest ? Buffer.from(values[1].swap_payment_dest, 'base64').toString('hex') : '';
            logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quotes 1', data: values[0] });
            logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quotes 2', data: values[1] });
            logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Loop In Terms & Qoutes Received' });
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
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting List Swaps..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'List Swaps Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/swaps';
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Swaps', data: body });
        if (body.swaps && body.swaps.length > 0) {
            body.swaps = common.sortDescByKey(body.swaps, 'initiation_time');
            logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Swaps after Sort', data: body });
        }
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'List Swaps Received' });
        res.status(200).json(body.swaps);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'List Swaps Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
export const swap = (req, res, next) => {
    logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Getting Swap Information..' });
    options = common.getSwapServerOptions(req);
    if (options.url === '') {
        const errMsg = 'Loop Server URL is missing in the configuration.';
        const err = common.handleError({ statusCode: 500, message: 'Get Swap Error', error: errMsg }, 'Loop', errMsg, req);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options.url = options.url + '/v1/loop/swap/' + req.params.id;
    request(options).then((body) => {
        logger.log({ level: 'DEBUG', fileName: 'Loop', msg: 'Loop Swap', data: body });
        logger.log({ level: 'INFO', fileName: 'Loop', msg: 'Swap Information Received' });
        res.status(200).json(body);
    }).catch((errRes) => {
        const err = common.handleError(errRes, 'Loop', 'Get Swap Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
    });
};
