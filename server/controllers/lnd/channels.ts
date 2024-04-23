import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { SelectedNode } from '../../models/config.model.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const getAliasForChannel = (selNode: SelectedNode, channel) => {
  const pubkey = (channel.remote_pubkey) ? channel.remote_pubkey : (channel.remote_node_pub) ? channel.remote_node_pub : '';
  options.url = selNode.Settings.lnServerUrl + '/v1/graph/node/' + pubkey;
  return request(options).then((aliasBody) => {
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Channels', msg: 'Alias Received', data: aliasBody.node.alias });
    channel.remote_alias = aliasBody.node.alias && aliasBody.node.alias !== '' ? aliasBody.node.alias : aliasBody.node.pub_key.slice(0, 20);
    return channel;
  }).catch((err) => {
    channel.remote_alias = pubkey.slice(0, 20);
    return channel;
  });
};

export const getAllChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channels..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/channels';
  options.qs = req.query;
  let local = 0;
  let remote = 0;
  let total = 0;
  request(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Channels List Received', data: body });
    if (body.channels) {
      return Promise.all(
        body.channels?.map((channel) => {
          local = (channel.local_balance) ? +channel.local_balance : 0;
          remote = (channel.remote_balance) ? +channel.remote_balance : 0;
          total = local + remote;
          channel.balancedness = (total === 0) ? 1 : (1 - Math.abs((local - remote) / total)).toFixed(3);
          return getAliasForChannel(req.session.selectedNode, channel);
        })
      ).then((values) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Sorted Channels List Received', data: body });
        return res.status(200).json(body);
      }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Get All Channel Aliases Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
    } else {
      body.channels = [];
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Empty Channels List Received' });
      return res.status(200).json(body);
    }
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'List Channels Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getPendingChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Pending Channels..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/channels/pending';
  options.qs = req.query;
  request(options).then((body) => {
    if (!body.total_limbo_balance) {
      body.total_limbo_balance = 0;
    }
    const promises = [];
    if (body.pending_open_channels && body.pending_open_channels.length > 0) {
      body.pending_open_channels?.map((channel) => promises.push(getAliasForChannel(req.session.selectedNode, channel.channel)));
    }
    if (body.pending_force_closing_channels && body.pending_force_closing_channels.length > 0) {
      body.pending_force_closing_channels?.map((channel) => promises.push(getAliasForChannel(req.session.selectedNode, channel.channel)));
    }
    if (body.pending_closing_channels && body.pending_closing_channels.length > 0) {
      body.pending_closing_channels?.map((channel) => promises.push(getAliasForChannel(req.session.selectedNode, channel.channel)));
    }
    if (body.waiting_close_channels && body.waiting_close_channels.length > 0) {
      body.waiting_close_channels?.map((channel) => promises.push(getAliasForChannel(req.session.selectedNode, channel.channel)));
    }
    return Promise.all(promises).then((values) => {
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Pending Channels List Received', data: body });
      return res.status(200).json(body);
    }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Get Pending Channel Aliases Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'List Pending Channels Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const getClosedChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Closed Channels..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/channels/closed';
  options.qs = req.query;
  request(options).then((body) => {
    if (body.channels && body.channels.length > 0) {
      return Promise.all(
        body.channels?.map((channel) => {
          channel.close_type = (!channel.close_type) ? 'COOPERATIVE_CLOSE' : channel.close_type;
          return getAliasForChannel(req.session.selectedNode, channel);
        })
      ).then((values) => {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closed Channels List Received', data: body });
        return res.status(200).json(body);
      }).catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'Get Closed Channel Aliases Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
    } else {
      body.channels = [];
      return res.status(200).json(body);
    }
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'List Closed Channels Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const postChannel = (req, res, next) => {
  const { node_pubkey, private: privateChannel, spend_unconfirmed, local_funding_amount, trans_type, trans_type_value, commitment_type } = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/channels';
  options.form = {
    node_pubkey_string: node_pubkey,
    local_funding_amount: local_funding_amount,
    private: privateChannel,
    spend_unconfirmed: spend_unconfirmed
  };
  if (trans_type === '1') {
    options.form.target_conf = trans_type_value;
  } else if (trans_type === '2') {
    options.form.sat_per_byte = trans_type_value;
  }
  if (commitment_type) {
    options.form.commitment_type = commitment_type;
  }
  options.form = JSON.stringify(options.form);
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Channel Open Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Opened', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Open Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const postTransactions = (req, res, next) => {
  const { paymentReq, paymentAmount, feeLimit, outgoingChannel, allowSelfPayment, lastHopPubkey } = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Sending Payment..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/channels/transaction-stream';
  options.form = { payment_request: paymentReq };
  if (paymentAmount) {
    options.form.amt = paymentAmount;
  }
  if (feeLimit) { options.form.fee_limit = feeLimit; }
  if (outgoingChannel) { options.form.outgoing_chan_id = outgoingChannel; }
  if (allowSelfPayment) { options.form.allow_self_payment = allowSelfPayment; }
  if (lastHopPubkey) { options.form.last_hop_pubkey = Buffer.from(lastHopPubkey, 'hex').toString('base64'); }
  options.form = JSON.stringify(options.form);
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Send Payment Options', data: options.form });
  request.post(options).then((body) => {
    body = body.result ? body.result : body;
    if (body.payment_error) {
      const err = common.handleError(body.payment_error, 'Channels', 'Send Payment Error', req.session.selectedNode);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    } else {
      logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Payment Sent', data: body });
      res.status(201).json(body);
    }
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Send Payment Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const closeChannel = (req, res, next) => {
  try {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..' });
    if (!req.session.selectedNode) {
      const err = common.handleError({ message: 'Session Expired after a day\'s inactivity.', statusCode: 401 }, 'Session Expired', 'Session Expiry Error', null);
      return res.status(err.statusCode).json({ message: err.message, error: err.error });
    }
    options = common.getOptions(req);
    if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
    const channelpoint = req.params.channelPoint?.replace(':', '/');
    options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/channels/' + channelpoint + '?force=' + req.query.force;
    if (req.query.target_conf) { options.url = options.url + '&target_conf=' + req.query.target_conf; }
    if (req.query.sat_per_byte) { options.url = options.url + '&sat_per_byte=' + req.query.sat_per_byte; }
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel Options URL', data: options.url });
    request.delete(options);
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Close Requested' });
    res.status(202).json({ message: 'Close channel request has been submitted.' });
  } catch (error: any) {
    logger.log({ selectedNode: req.session.selectedNode, level: 'ERROR', fileName: 'Channels', msg: 'Close Channel Error', error: error.message });
    return res.status(500).json({ message: 'Close Channel Error', error: error.message });
  }
};

export const postChanPolicy = (req, res, next) => {
  const { chanPoint, baseFeeMsat, feeRate, timeLockDelta, max_htlc_msat, min_htlc_msat } = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Updating Channel Policy..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.Settings.lnServerUrl + '/v1/chanpolicy';
  if (chanPoint === 'all') {
    options.form = JSON.stringify({
      global: true,
      base_fee_msat: baseFeeMsat,
      fee_rate: parseFloat((feeRate / 1000000).toString()),
      time_lock_delta: parseInt(timeLockDelta)
    });
  } else {
    const breakPoint = chanPoint.indexOf(':');
    const txid_str = chanPoint.substring(0, breakPoint);
    const output_idx = chanPoint.substring(breakPoint + 1, chanPoint.length);
    const optionsBody = {
      base_fee_msat: baseFeeMsat,
      fee_rate: parseFloat((feeRate / 1000000).toString()),
      time_lock_delta: parseInt(timeLockDelta),
      chan_point: { funding_txid_str: txid_str, output_index: parseInt(output_idx) }
    };
    if (max_htlc_msat) {
      optionsBody['max_htlc_msat'] = max_htlc_msat;
    }
    if (min_htlc_msat) {
      optionsBody['min_htlc_msat'] = min_htlc_msat;
      optionsBody['min_htlc_msat_specified'] = true;
    }
    options.form = JSON.stringify(optionsBody);
  }

  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy Options', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Policy Updated', data: body });
    if (body.failed_updates && body.failed_updates.length && body.failed_updates[0].update_error) {
      const err = common.handleError({ error: body.failed_updates[0].update_error }, 'Channels', 'Update Channel Policy Error', req.session.selectedNode);
      return res.status(500).json({ message: err.message, error: err.error });
    }
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Update Channel Policy Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};
