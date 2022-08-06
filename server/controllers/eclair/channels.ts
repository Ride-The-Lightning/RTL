import request from 'request-promise';
import { Logger, LoggerService } from '../../utils/logger.js';
import { Common, CommonService } from '../../utils/common.js';
import { CommonSelectedNode } from '../../models/config.model.js';
let options = null;
const logger: LoggerService = Logger;
const common: CommonService = Common;

export const simplifyAllChannels = (selNode: CommonSelectedNode, channels) => {
  let channelNodeIds = '';
  const simplifiedChannels = [];
  channels.forEach((channel) => {
    channelNodeIds = channelNodeIds + ',' + channel.nodeId;
    simplifiedChannels.push({
      nodeId: channel.nodeId ? channel.nodeId : '',
      channelId: channel.channelId ? channel.channelId : '',
      state: channel.state ? channel.state : '',
      channelFlags: channel.data && channel.data.commitments && channel.data.commitments.channelFlags ? channel.data.commitments.channelFlags : 0,
      toLocal: (channel.data.commitments.localCommit.spec.toLocal) ? Math.round(+channel.data.commitments.localCommit.spec.toLocal / 1000) : 0,
      toRemote: (channel.data.commitments.localCommit.spec.toRemote) ? Math.round(+channel.data.commitments.localCommit.spec.toRemote / 1000) : 0,
      shortChannelId: channel.data && channel.data.shortChannelId ? channel.data.shortChannelId : '',
      isFunder: channel.data && channel.data.commitments && channel.data.commitments.localParams && channel.data.commitments.localParams.isFunder ? channel.data.commitments.localParams.isFunder : false,
      buried: channel.data && channel.data.buried ? channel.data.buried : false,
      feeBaseMsat: channel.data && channel.data.channelUpdate && channel.data.channelUpdate.feeBaseMsat ? channel.data.channelUpdate.feeBaseMsat : 0,
      feeRatePerKw: (channel.data.commitments.localCommit.spec.feeratePerKw) ? channel.data.commitments.localCommit.spec.feeratePerKw : 0,
      feeProportionalMillionths: channel.data && channel.data.channelUpdate && channel.data.channelUpdate.feeProportionalMillionths ? channel.data.channelUpdate.feeProportionalMillionths : 0,
      alias: ''
    });
  });
  channelNodeIds = channelNodeIds.substring(1);
  options.url = selNode.ln_server_url + '/nodes';
  options.form = { nodeIds: channelNodeIds };
  logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Channels', msg: 'Node Ids to find alias', data: channelNodeIds });
  return request.post(options).then((nodes) => {
    logger.log({ selectedNode: selNode, level: 'DEBUG', fileName: 'Channels', msg: 'Filtered Nodes Received', data: nodes });
    let foundPeer = null;
    simplifiedChannels.map((channel) => {
      foundPeer = nodes.find((channelWithAlias) => channel.nodeId === channelWithAlias.nodeId);
      channel.alias = foundPeer ? foundPeer.alias : channel.nodeId.substring(0, 20);
      return channel;
    });
    return simplifiedChannels;
  }).catch((err) => simplifiedChannels);
};

export const getChannels = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'List Channels..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/channels';
  options.form = {};
  if (req.query && req.query.nodeId) {
    options.form = req.query;
    logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Channels Node Id', data: options.form });
  }
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Options', data: options });
  if (common.read_dummy_data) {
    common.getDummyData('Channels', req.session.selectedNode.ln_implementation).then((data) => { res.status(200).json(data); });
  } else {
    request.post(options).then((body) => {
      logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Channels List Received', data: body });
      if (body && body.length) {
        return simplifyAllChannels(req.session.selectedNode, body).then((simplifiedChannels) => {
          logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Simplified Channels with Alias Received', data: simplifiedChannels });
          res.status(200).json(simplifiedChannels);
        });
      } else {
        logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Empty Channels List Received' });
        res.status(200).json([]);
      }
    }).
      catch((errRes) => {
        const err = common.handleError(errRes, 'Channels', 'List Channels Error', req.session.selectedNode);
        return res.status(err.statusCode).json({ message: err.message, error: err.error });
      });
  }
};

export const getChannelStats = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Getting Channel States..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/channelstats';
  options.form = {};
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel States Received', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Get Channel Stats Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const openChannel = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/open';
  options.form = req.body;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Params', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Opened', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Open Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const updateChannelRelayFee = (req, res, next) => {
  logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Updating Channel Relay Fee..' });
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  options.url = req.session.selectedNode.ln_server_url + '/updaterelayfee';
  options.form = req.query;
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Update Relay Fee Params', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Relay Fee Updated', data: body });
    res.status(201).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Update Relay Fee Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

export const closeChannel = (req, res, next) => {
  options = common.getOptions(req);
  if (options.error) { return res.status(options.statusCode).json({ message: options.message, error: options.error }); }
  if (req.query.force !== 'true') {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..' });
    options.url = req.session.selectedNode.ln_server_url + '/close';
  } else {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Force Closing Channel..' });
    options.url = req.session.selectedNode.ln_server_url + '/forceclose';
  }
  options.form = { channelId: req.query.channelId };
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Close URL', data: options.url });
  logger.log({ selectedNode: req.session.selectedNode, level: 'DEBUG', fileName: 'Channels', msg: 'Close Params', data: options.form });
  request.post(options).then((body) => {
    logger.log({ selectedNode: req.session.selectedNode, level: 'INFO', fileName: 'Channels', msg: 'Channel Closed', data: body });
    res.status(204).json(body);
  }).catch((errRes) => {
    const err = common.handleError(errRes, 'Channels', 'Close Channel Error', req.session.selectedNode);
    return res.status(err.statusCode).json({ message: err.message, error: err.error });
  });
};

