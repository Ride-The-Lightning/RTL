import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const arrangeBalances = (body) => {
  if (!body.confirmed) { body.confirmed = 0; }
  if (!body.unconfirmed) { body.unconfirmed = 0; }
  body.total = +body.confirmed + +body.unconfirmed;
  body.btc_total = +body.btc_confirmed + +body.btc_unconfirmed;
  return body;
};

export const getNewAddress = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'Generating New Address..' });
  options = common.getOptions(req);
  options.url = req.session.selectedNode.ln_server_url + '/getnewaddress';
  options.form = {};
  request.post(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Onchain', msg: 'New Address Generated', data: body });
    logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'New Address Generated' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'OnChain', 'Get New Address Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getBalance = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'Getting On Chain Balance..' });
  options = common.getOptions(req);
  options.url = req.session.selectedNode.ln_server_url + '/onchainbalance';
  options.form = {};
  if (common.read_dummy_data) {
    common.getDummyData('OnChainBalance', req.session.selectedNode.ln_implementation).then((data) => { res.status(200).json(arrangeBalances(data)); });
  } else {
    request.post(options).then((body) => {
      logger.log({ level: 'DEBUG', fileName: 'Onchain', msg: 'Balance Received', data: body });
      logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'On Chain Balance Received' });
      res.status(200).json(arrangeBalances(body));
    }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'OnChain', 'Get Balance Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  }
};

export const getTransactions = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'Getting On Chain Transactions..' });
  options = common.getOptions(req);
  options.url = req.session.selectedNode.ln_server_url + '/onchaintransactions';
  options.form = {
    count: req.query.count,
    skip: req.query.skip
  };
  logger.log({ level: 'DEBUG', fileName: 'OnChain', msg: 'Getting On Chain Transactions Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'OnChain', msg: 'Transaction Received', data: body });
    if (body && body.length > 0) {
      body = common.sortDescByKey(body, 'timestamp');
    }
    logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'On Chain Transaction Received' });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'OnChain', 'Get Transactions Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const sendFunds = (req, res, next) => {
  logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'Sending On Chain Funds..' });
  options = common.getOptions(req);
  options.url = req.session.selectedNode.ln_server_url + '/sendonchain';
  options.form = {
    address: req.body.address,
    amountSatoshis: req.body.amount,
    confirmationTarget: req.body.blocks
  };
  logger.log({ level: 'DEBUG', fileName: 'Onchain', msg: 'Send Funds Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ level: 'DEBUG', fileName: 'Onchain', msg: 'Send Funds Response', data: body });
    logger.log({ level: 'INFO', fileName: 'OnChain', msg: 'On Chain Fund Sent' });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'OnChain', 'Send Funds Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
