import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const listChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channels..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/listChannels';
  request(options).then((body) => {
    body.map((channel) => {
      if (!channel.alias || channel.alias === '') { channel.alias = channel.id.substring(0, 20); }
      const local = (channel.msatoshi_to_us) ? channel.msatoshi_to_us : 0;
      const remote = (channel.msatoshi_to_them) ? channel.msatoshi_to_them : 0;
      const total = channel.msatoshi_total ? channel.msatoshi_total : 0;
      channel.balancedness = (total === 0) ? 1 : (1 - Math.abs((local - remote) / total)).toFixed(3);
      return channel;
    });
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channels List Received', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'List Channels Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const openChannel = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/openChannel';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Options', data: options.body });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Opened', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Open Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const setChannelFee = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Setting Channel Fee..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/setChannelFee';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy Options', data: options.body });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Updated Channel Policy', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Update Channel Policy Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const closeChannel = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..' });
  req.setTimeout(60000 * 10); // timeout 10 mins
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  const unilateralTimeoutQuery = req.query.force ? '?unilateralTimeout=1' : '';
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/closeChannel/' + req.params.channelId + unilateralTimeoutQuery;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel', data: options.url });
  request.delete(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Closed', data: body });
    res.status(204).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Close Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getLocalRemoteBalance = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Local & Remote Balances..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/localremotebal';
  request(options).then((body) => {
    if (!body.localBalance) { body.localBalance = 0; }
    if (!body.remoteBalance) { body.remoteBalance = 0; }
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Local Remote Balance Received', data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Local Remote Balance Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listForwards = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channel List Forwards..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/listForwards?status=' + (req.query.status ? req.query.status : 'settled');
  request.get(options).then((body) => {
    if (body && body.length > 0) { body = common.sortDescByKey(body, 'received_time'); }
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Forwarding History Received For Status' + req.query.status, data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Forwarding History Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const funderUpdatePolicy = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting or Updating Funder Policy..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/funderUpdate';
  if (req.body && req.body.policy) {
    options.body = req.body;
  }
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Funder Update Body', data: options.body });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Funder Policy Received', data: body });
    body.channel_fee_max_base_msat = (body.channel_fee_max_base_msat && typeof body.channel_fee_max_base_msat === 'string' && body.channel_fee_max_base_msat.includes('msat')) ? +body.channel_fee_max_base_msat.replace('msat', '') : body.channel_fee_max_base_msat;
    body.lease_fee_base_msat = (body.lease_fee_base_msat && typeof body.lease_fee_base_msat === 'string' && body.lease_fee_base_msat.includes('msat')) ? +body.lease_fee_base_msat.replace('msat', '') : body.channel_fee_max_base_msat;
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Funder Policy Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listForwardsPaginated = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Paginated List Forwards..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  const { status, maxLen, offset } = req.query;
  let queryStr = '?status=' + (status ? status : 'settled');
  queryStr = queryStr + '&maxLen=' + (maxLen ? maxLen : '10');
  queryStr = queryStr + '&offset=' + (offset ? offset : '0');
  options.url = req.session.selectedNode.ln_server_url + '/v1/channel/listForwardsPaginated' + queryStr;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Paginated Forwarding History url' + options.url });
  request.get(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Paginated Forwarding History Received For Status ' + req.query.status, data: body });
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Paginated Forwarding History Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
