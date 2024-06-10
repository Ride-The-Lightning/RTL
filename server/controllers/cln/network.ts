import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { SelectedNode } from '../../models/config.model.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getRoute = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Getting Network Routes..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/getroute';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Network Routes Received', data: body });
    return Promise.all(body.route?.map((rt) => getAlias(req.session.selectedNode, rt, 'id'))).then((values) => {
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Peers', msg: 'Network Routes with Alias Received', data: body });
      res.status(200).json(body || []);
    });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Network', 'Query Routes Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Channel Lookup..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/listchannels';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Channel Lookup Finished', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Network', 'Channel Lookup Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const feeRates = (req, res, next) => {
  const { style } = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Getting Network Fee Rates..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/feerates';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Network Fee Rates Received for ' + style, data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Network', 'Fee Rates Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listNodes = (req, res, next) => {
  const filter_liquidity_ads = !!req.body.liquidity_ads;
  delete req.body.liquidity_ads;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'List Nodes..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/listnodes';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Network', msg: 'List Nodes URL' + options.url });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'List Nodes Finished', data: body });
    let response = body.nodes;
    if (filter_liquidity_ads) {
      response = body.nodes.filter((node) => ((node.option_will_fund) ? node : null));
    }
    res.status(200).json(response);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Network', 'Node Lookup Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getAlias = (selNode: SelectedNode, peer: any, id: string) => {
  options.url = selNode.settings.lnServerUrl + '/v1/listnodes';
  if (!peer[id]) {
    logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Network', msg: 'Empty Peer ID' });
    peer.alias = '';
    return peer;
  }
  options.body = { id : peer[id] };
  return request.post(options).then((body) => {
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Network', msg: 'Peer Alias Finished', data: body });
    peer.alias = body.nodes[0] && body.nodes[0].alias ? body.nodes[0].alias : peer[id].substring(0, 20);
    return peer;
  }).catch((errRes) => {
    common.handleError(errRes, 'Network', 'Peer Alias Error', selNode);
    peer.alias = peer[id].substring(0, 20);
    return peer;
  });
};
