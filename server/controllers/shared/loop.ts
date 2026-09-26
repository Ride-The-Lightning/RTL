import request from '../../utils/request.js';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
const logger: LoggerService = Logger;
const common: CommonService = Common;

// Every handler builds its own options from the session's selected node (#1714). They used
// to live in one module-level object set by loopInfo, so a request made while another node
// was selected went to the first node's Loop server with its macaroon, and the missing-URL
// guard checked `options.url`, a key setSwapServerOptions never sets.
const swapOptions = (req, res, errTitle): Record<string, any> | null => {
  const options: Record<string, any> = common.setSwapServerOptions(req);
  if (!options.baseUrl) {
    const errMsg = 'Loop Server URL is missing in the configuration.';
    const err = common.handleError({ statusCode: 500, message: errTitle, error: errMsg }, 'Loop', errMsg, req.session.selectedNode);
    res.status(err.statusCode).json({ message: err.message, error: err.error });
    return null;
  }
  return options;
};

// Query for the four quote endpoints: conf_target defaults to 2 as before, and
// swap_publication_deadline is sent only when the caller supplied one, so the Loop
// server applies its own default instead of receiving the string "undefined" (#1698).
const quoteQuery = (req, res) => {
  const targetConf = common.parseQueryInt(req.query.targetConf);
  const deadline = common.parseQueryInt(req.query.swapPublicationDeadline);
  if (targetConf === null) { common.invalidQueryParam(res, 'targetConf', 'a non-negative integer'); return null; }
  if (deadline === null) { common.invalidQueryParam(res, 'swapPublicationDeadline', 'a non-negative integer'); return null; }
  const qs: Record<string, any> = { conf_target: targetConf || 2 };
  if (deadline !== undefined) { qs.swap_publication_deadline = deadline; }
  return qs;
};

const quoteAmount = (req, res) => {
  const amount = common.parseQueryInt(req.params.amount);
  if (amount === undefined || amount === null) { common.invalidQueryParam(res, 'amount', 'a non-negative integer'); return null; }
  return amount;
};

export const loopOut = (req, res, next) => {
  const { amount, targetConf, swapRoutingFee, minerFee, prepayRoutingFee, prepayAmt, swapFee, swapPublicationDeadline, chanId, destAddress } = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Looping Out..' });
  const options = swapOptions(req, res, 'Loop Out Error');
  if (!options) { return; }
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
  if (chanId !== '') { options.body['loop_out_channel'] = chanId; }
  if (destAddress !== '') { options.body['dest'] = destAddress; }
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
  const options = swapOptions(req, res, 'Loop Out Terms Error');
  if (!options) { return; }
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
  const options = swapOptions(req, res, 'Loop Out Quotes Error');
  if (!options) { return; }
  const qs = quoteQuery(req, res);
  if (qs === null) { return; }
  const amount = quoteAmount(req, res);
  if (amount === null) { return; }
  const quoteOptions = { ...options, uri: '/v1/loop/out/quote/' + amount, qs };
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop Out Quote URL', data: { uri: quoteOptions.uri, qs } });
  request(quoteOptions).then((quoteRes) => {
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
  const options = swapOptions(req, res, 'Loop Out Terms & Quotes Error');
  if (!options) { return; }
  const qs = quoteQuery(req, res);
  if (qs === null) { return; }
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
  const options = swapOptions(req, res, 'Loop In Error');
  if (!options) { return; }
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
  const options = swapOptions(req, res, 'Loop In Terms Error');
  if (!options) { return; }
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
  const options = swapOptions(req, res, 'Loop In Quote Error');
  if (!options) { return; }
  const qs = quoteQuery(req, res);
  if (qs === null) { return; }
  const amount = quoteAmount(req, res);
  if (amount === null) { return; }
  const quoteOptions = { ...options, uri: '/v1/loop/in/quote/' + amount, qs };
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Loop', msg: 'Loop In Quote Options', data: { uri: quoteOptions.uri, qs } });
  request(quoteOptions).then((body) => {
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
  const options = swapOptions(req, res, 'Loop In Terms & Quotes Error');
  if (!options) { return; }
  const qs = quoteQuery(req, res);
  if (qs === null) { return; }
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
  const options = swapOptions(req, res, 'List Swaps Error');
  if (!options) { return; }
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
  const options = swapOptions(req, res, 'Get Swap Error');
  if (!options) { return; }
  // Loop identifies a swap by its hex-encoded swap hash; anything else is refused before it
  // can reach the upstream path (Express has already percent-decoded it).
  if (typeof req.params.id !== 'string' || !(/^[0-9a-fA-F]{64}$/).test(req.params.id)) {
    return common.invalidQueryParam(res, 'id', 'a 64-character hex swap hash');
  }
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
  const options = swapOptions(req, res, 'Get Loop Info Error');
  if (!options) { return; }
  options.uri = '/v1/loop/info';
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Loop', msg: 'Loop Information Received', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Loop', 'Get Loop Info Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
