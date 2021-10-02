var request = require('request-promise');
var common = require('../../utils/common');
var logger = require('../../utils/logger');
var options = {};

arrangeChannels = (simplifiedChannels) => {
  let channelTotal = 0;
  let totalLocalBalance = 0;
  let totalRemoteBalance = 0;
  let lightningBalances = { localBalance: 0, remoteBalance: 0 };
  let channelStatus = {active: { channels: 0, capacity: 0 }, inactive: { channels: 0, capacity: 0 }, pending: { channels:  0, capacity: 0 }};
  let activeChannels = [];
  let pendingChannels = [];
  let inactiveChannels = [];
  simplifiedChannels.forEach((channel, i) => {
    if (channel.state === 'NORMAL') {
      channelTotal = channel.toLocal + channel.toRemote;
      totalLocalBalance = totalLocalBalance + channel.toLocal;
      totalRemoteBalance = totalRemoteBalance + channel.toRemote;
      channel.balancedness = (channelTotal == 0) ? 1 : (1 - Math.abs((channel.toLocal-channel.toRemote)/channelTotal)).toFixed(3);
      activeChannels.push(channel);
      channelStatus.active.channels = channelStatus.active.channels + 1;
      channelStatus.active.capacity = channelStatus.active.capacity + channel.toLocal;
    } else if (channel.state.includes('WAIT') || channel.state.includes('CLOSING') || channel.state.includes('SYNCING')) {
      channel.state = channel.state.replace(/_/g, ' ');
      pendingChannels.push(channel);
      channelStatus.pending.channels = channelStatus.pending.channels + 1;
      channelStatus.pending.capacity = channelStatus.pending.capacity + channel.toLocal;
    } else {
      channel.state = channel.state.replace(/_/g, ' ');
      inactiveChannels.push(channel);
      channelStatus.inactive.channels = channelStatus.inactive.channels + 1;
      channelStatus.inactive.capacity = channelStatus.inactive.capacity + channel.toLocal;
    }
  });
  lightningBalances = { localBalance: totalLocalBalance, remoteBalance: totalRemoteBalance };
  activeChannels = common.sortDescByKey(activeChannels, 'balancedness');
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Lightning Balances', data: lightningBalances});
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Active Channels', data: activeChannels});
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Pending Channels', data: pendingChannels});
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Inactive Channels', data: inactiveChannels});
  return ({activeChannels: activeChannels, pendingChannels: pendingChannels, inactiveChannels: inactiveChannels, lightningBalances: lightningBalances, channelStatus: channelStatus});
};

simplifyAllChannels = (channels) => {
  let channelNodeIds = '';
  let simplifiedChannels = [];
  channels.forEach(channel => { 
    channelNodeIds = channelNodeIds + ',' + channel.nodeId; 
    simplifiedChannels.push({
      nodeId: channel.nodeId ? channel.nodeId : '',
      channelId: channel.channelId ? channel.channelId : '',
      state: channel.state ? channel.state : '',
      channelFlags: channel.data && channel.data.commitments && channel.data.commitments.channelFlags ? channel.data.commitments.channelFlags : 0,
      toLocal: (channel.data.commitments.localCommit.spec.toLocal) ? Math.round(+channel.data.commitments.localCommit.spec.toLocal/1000) : 0,
      toRemote: (channel.data.commitments.localCommit.spec.toRemote) ? Math.round(+channel.data.commitments.localCommit.spec.toRemote/1000) : 0,
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
  options.url = common.getSelLNServerUrl() + '/nodes';
  options.form = { nodeIds: channelNodeIds };
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Node Ids to find alias', data: channelNodeIds});
  return request.post(options).then(function(nodes) {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Filtered Nodes', data: nodes});
    let foundPeer = {};
    simplifiedChannels.map(channel => {
      foundPeer = nodes.find(channelWithAlias => channel.nodeId === channelWithAlias.nodeId);
      channel.alias = foundPeer ? foundPeer.alias : channel.nodeId.substring(0, 20);
    });
    return simplifiedChannels;
  }).catch(err => {
    return simplifiedChannels;
  });
};

exports.getChannels = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'List Channels..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels';
  options.form = {};
  if (req.query && req.query.nodeId) {
    options.form = req.query;
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Channels Node Id', data: options.form});
  }
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Options', data: options});
  if (common.read_dummy_data) {
    common.getDummyData('Channels').then(function(data) { res.status(200).json(arrangeChannels(data)); });
  } else {
    request.post(options).then(function (body) {
      logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'All Channels', data: body});
      if (body && body.length) {
        return simplifyAllChannels(body).then(function(simplifiedChannels) {
          logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Simplified Channels with Alias', data: simplifiedChannels});
          logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channels List Received'});
          res.status(200).json(arrangeChannels(simplifiedChannels));
        });
      } else {
        logger.log({level: 'INFO', fileName: 'Channels', msg: 'Empty Channels List Received'});
        res.status(200).json({activeChannels: [], pendingChannels: [], inactiveChannels: [], lightningBalances: { localBalance: 0, remoteBalance: 0 }, channelStatus: {active: { channels: 0, capacity: 0 }, inactive: { channels: 0, capacity: 0 }, pending: { channels:  0, capacity: 0 }}});
      }
    })
    .catch(errRes => {
      const err = common.handleError(errRes,  'Channels', 'List Channels Error');
      return res.status(err.statusCode).json({message: err.message, error: err.error});
    });
  }
};

exports.getChannelStats = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Getting Channel States..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channelstats';
  options.form = {};
  request.post(options).then((body) => { 
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Channel Stats Response', data: body});
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel States Received'});
    res.status(201).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Channels', 'Get Channel Stats Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });  
}

exports.openChannel = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/open';
  options.form = req.body;
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Params', data: options.form});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Response', data: body});
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel Opened'});
    res.status(201).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Channels', 'Open Channel Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
}

exports.updateChannelRelayFee = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Updating Channel Relay Fee..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/updaterelayfee';
  options.form = req.query;
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Update Relay Fee Params', data: options.form});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Update Relay Fee Response', data: body});
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel Relay Fee Updated'});
    res.status(201).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Channels', 'Update Relay Fee Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
}

exports.closeChannel = (req, res, next) => {
  options = common.getOptions();
  if (req.query.force !== 'true') {
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..'});
    options.url = common.getSelLNServerUrl() + '/close';
  } else {
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Force Closing Channel..'});
    options.url = common.getSelLNServerUrl() + '/forceclose';
  }
  options.form = { channelId: req.query.channelId };
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: '[Close URL, Close Params]', data: [options.url, options.form]});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Close Channel Response', data: body});
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel Closed'});
    res.status(204).json(body);
  })
  .catch(errRes => {
    const err = common.handleError(errRes,  'Channels', 'Close Channel Error');
    return res.status(err.statusCode).json({message: err.message, error: err.error});
  });
}

