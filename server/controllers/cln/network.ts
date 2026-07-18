import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { SelectedNode } from '../../models/config.model.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;
// Alias cache: peerId -> { alias, ts }. Bounded by a TTL so an updated node alias is picked
// up without an RTL restart, and by a max size so it can't grow unbounded (evicts oldest).
const ALIAS_CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours
const ALIAS_CACHE_MAX = 5000;
const aliasCache = new Map<string, { alias: string; ts: number }>();

export const getRoute = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Getting Network Routes..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.settings.lnServerUrl + '/v1/getroute';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Network', msg: 'Network Routes Received', data: body });
    // Resolve hop aliases with a bounded number of concurrent listnodes calls, matching the
    // peers/channels paths, so a long route can't storm clnrest (#1501).
    const getRouteAliasesTasks = (body.route || []).map((rt) => () => getAlias(req.session.selectedNode, rt, 'id'));
    common.runWithConcurrencyLimit(getRouteAliasesTasks, 20, () => {
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
  const peerId = peer[id];
  if (!peerId) {
    logger.log({ selectedNode: selNode, level: 'ERROR', fileName: 'Network', msg: 'Empty Peer ID' });
    peer.alias = '';
    return Promise.resolve(peer);
  }

  const cached = aliasCache.get(peerId);
  if (cached && (Date.now() - cached.ts) < ALIAS_CACHE_TTL) {
    peer.alias = cached.alias;
    return Promise.resolve(peer);
  }

  // Build a self-contained request from the selected node's own auth options rather than the
  // shared module-level 'options', which is only set by a prior network.ts endpoint call. That
  // coupling meant a cold Peers/route lookup (no prior network call) dereferenced a null 'options'
  // and threw; now that the limiter swallows per-task throws, that surfaced as a 200 with every
  // alias unset (#1501 review F1). selNode.authentication.options is guaranteed present here
  // because every caller runs getOptions() first.
  const nodeOptions = selNode.authentication?.options;
  if (!nodeOptions || !nodeOptions.headers) {
    peer.alias = peerId.substring(0, 20);
    return Promise.resolve(peer);
  }
  const aliasOptions = { ...nodeOptions, method: 'POST', url: selNode.settings.lnServerUrl + '/v1/listnodes', body: { id: peerId }, json: true, qs: {} };
  delete aliasOptions.form;

  return request.post(aliasOptions).then((body) => {
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Network', msg: 'Peer Alias Finished', data: body });
    const alias = body.nodes?.[0]?.alias || peerId.substring(0, 20);
    // Re-insert so a refreshed entry moves to the most-recent position, then evict the
    // oldest if we're over the cap (Map preserves insertion order).
    aliasCache.delete(peerId);
    aliasCache.set(peerId, { alias, ts: Date.now() });
    if (aliasCache.size > ALIAS_CACHE_MAX) { aliasCache.delete(aliasCache.keys().next().value); }
    peer.alias = alias;
    return peer;
  }).catch((errRes) => {
    common.handleError(errRes, 'Network', 'Peer Alias Error', selNode);
    const alias = peerId.substring(0, 20);
    peer.alias = alias;
    return peer;
  });
};
