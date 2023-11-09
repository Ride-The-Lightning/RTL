import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { getAlias } from './network.js';

let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const listPeerChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Peer Channels..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listpeerchannels';
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Peer Channels List Received', data: body.channels });
    return Promise.all(body.channels?.map((channel) => {
      channel.to_us_msat = common.removeMSat(channel.to_us_msat);
      channel.total_msat = common.removeMSat(channel.total_msat);
      channel.to_them_msat = channel.total_msat - channel.to_us_msat;
      channel.last_tx_fee_msat = common.removeMSat(channel.last_tx_fee_msat);
      channel.funding.local_funds_msat = common.removeMSat(channel.funding.local_funds_msat);
      channel.funding.remote_funds_msat = common.removeMSat(channel.funding.remote_funds_msat);
      channel.funding.pushed_msat = common.removeMSat(channel.funding.pushed_msat);
      channel.min_to_us_msat = common.removeMSat(channel.min_to_us_msat);
      channel.max_to_us_msat = common.removeMSat(channel.max);
      channel.fee_base_msat = common.removeMSat(channel.fee_base_msat);
      channel.dust_limit_msat = common.removeMSat(channel.dust_limit_msat);
      channel.max_total_htlc_in_msat = common.removeMSat(channel.max_total_htlc_in_msat);
      channel.their_reserve_msat = common.removeMSat(channel.their_reserve_msat);
      channel.our_reserve_msat = common.removeMSat(channel.our_reserve_msat);
      channel.spendable_msat = common.removeMSat(channel.spendable_msat);
      channel.receivable_msat = common.removeMSat(channel.receivable_msat);
      channel.minimum_htlc_in_msat = common.removeMSat(channel.minimum_htlc_in_msat);
      channel.minimum_htlc_out_msat = common.removeMSat(channel.minimum_htlc_out_msat);
      channel.maximum_htlc_out_msat = common.removeMSat(channel.maximum_htlc_out_msat);
      channel.in_offered_msat = common.removeMSat(channel.in_offered_msat);
      channel.in_fulfilled_msat = common.removeMSat(channel.in_fulfilled_msat);
      channel.out_offered_msat = common.removeMSat(channel.out_offered_msat);
      channel.out_fulfilled_msat = common.removeMSat(channel.out_fulfilled_msat);
      channel.balancedness = (channel.total_msat === 0) ? 1 : (1 - Math.abs((channel.to_us_msat - (channel.total_msat - channel.to_us_msat)) / channel.total_msat)).toFixed(3);
      return getAlias(req.session.selectedNode, channel, 'peer_id');
    })).then((values) => {
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Peer Channels List With Aliases Received', data: body.channels });
      return res.status(200).json(body.channels || []);
    });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'List Peer Channels Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const openChannel = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/fundchannel';
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
  options.url = req.session.selectedNode.ln_server_url + '/v1/setchannel';
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
  options.url = req.session.selectedNode.ln_server_url + '/v1/close';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel', data: options.url });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Closed', data: body });
    res.status(204).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Close Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const listForwards = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channel List Forwards..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/listforwards';
  options.body = req.body;
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Forwarding History Received For Status ' + req.body.status, data: body });
    body.forwards = !body.forwards ? [] : (req.body.status === 'failed' || req.body.status === 'local_failed') ? body.forwards.slice(Math.max(0, body.forwards.length - 1000), Math.max(1000, body.forwards.length)).reverse() : body.forwards.reverse();
    body.forwards.forEach((forward) => {
      forward.in_msat = common.removeMSat(forward.in_msat);
      forward.out_msat = common.removeMSat(forward.out_msat);
      forward.fee_msat = common.removeMSat(forward.fee_msat);
    });
    res.status(200).json(body.forwards);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Forwarding History Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const funderUpdatePolicy = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting or Updating Funder Policy..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/v1/funderupdate';
  options.body = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Funder Update Body', data: options.body });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Funder Policy Received', data: body });
    body.min_their_funding_msat = common.removeMSat(body.min_their_funding_msat);
    body.max_their_funding_msat = common.removeMSat(body.max_their_funding_msat);
    body.per_channel_min_msat = common.removeMSat(body.per_channel_min_msat);
    body.per_channel_max_msat = common.removeMSat(body.per_channel_max_msat);
    body.reserve_tank_msat = common.removeMSat(body.reserve_tank_msat);
    body.channel_fee_max_base_msat = common.removeMSat(body.channel_fee_max_base_msat);
    body.lease_fee_base_msat = common.removeMSat(body.lease_fee_base_msat);
    res.status(200).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Funder Policy Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
