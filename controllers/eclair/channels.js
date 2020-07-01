var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

simplifyChannel = (channel, idx) => {
  return {
    nodeId: channel.nodeId ? channel.nodeId : '',
    channelId: channel.channelId ? channel.channelId : '',
    state: channel.state ? channel.state : '',
    channelFlags: channel.data && channel.data.commitments && channel.data.commitments.channelFlags ? channel.data.commitments.channelFlags : 0,
    toLocal: (channel.data.commitments.localCommit.spec.toLocal) ? +channel.data.commitments.localCommit.spec.toLocal : 0,
    toRemote: (channel.data.commitments.localCommit.spec.toRemote) ? +channel.data.commitments.localCommit.spec.toRemote : 0,
    shortChannelId: channel.data && channel.data.shortChannelId ? channel.data.shortChannelId : '',
    buried: channel.data && channel.data.buried ? channel.data.buried : false,
    feeBaseMsat: channel.data && channel.data.channelUpdate && channel.data.channelUpdate.feeBaseMsat ? channel.data.channelUpdate.feeBaseMsat : 0,
    feeProportionalMillionths: channel.data && channel.data.channelUpdate && channel.data.channelUpdate.feeProportionalMillionths ? channel.data.channelUpdate.feeProportionalMillionths : 0,
    alias: channel.alias ? channel.alias : 'Node Alias ' + (idx + 1)
  };
};

exports.getChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels';
  if (req.query && req.query.nodeId) {
    options.form = req.query;
    logger.info({fileName: 'Channels', msg: 'Channels Node Id: ' + JSON.stringify(options.form)});
  }
  request.post(options).then(function (body) {
    logger.info({fileName: 'Channels', msg: 'All Channels: ' + JSON.stringify(body)});
    if(body) {
      let simplifiedChannel = null;
      let local = 0;
      let remote = 0;
      let channelTotal = 0;
      let totalLocalBalance = 0;
      let totalRemoteBalance = 0;
      let lightningBalances = { localBalance: 0, remoteBalance: 0 };
      let channelStatus = {active: { channels: 0, capacity: 0 }, inactive: { channels: 0, capacity: 0 }, pending: { channels:  0, capacity: 0 }};
      let activeChannels = [];
      let pendingChannels = [];
      let inactiveChannels = [];
      body.forEach((channel, i) => {
        if (channel.state === 'NORMAL') {
          local = (channel.data.commitments.localCommit.spec.toLocal) ? +channel.data.commitments.localCommit.spec.toLocal : 0;
          remote = (channel.data.commitments.localCommit.spec.toRemote) ? +channel.data.commitments.localCommit.spec.toRemote : 0;
          channelTotal = local + remote;
          totalLocalBalance = totalLocalBalance + local;
          totalRemoteBalance = totalRemoteBalance + remote;
          simplifiedChannel = simplifyChannel(channel, i);
          simplifiedChannel.balancedness = (channelTotal == 0) ? 1 : (1 - Math.abs((local-remote)/channelTotal)).toFixed(3);
          activeChannels.push(simplifiedChannel);
          channelStatus.active.channels = channelStatus.active.channels + 1;
          channelStatus.active.capacity = channelStatus.active.capacity + local;
        } else if (channel.state.includes('WAIT')) {
          pendingChannels.push(simplifyChannel(channel, i));
          channelStatus.pending.channels = channelStatus.pending.channels + 1;
          channelStatus.pending.capacity = channelStatus.pending.capacity + channel.data.commitments.localCommit.spec.toLocal;
        } else {
          inactiveChannels.push(simplifyChannel(channel, i));
          channelStatus.inactive.channels = channelStatus.inactive.channels + 1;
          channelStatus.inactive.capacity = channelStatus.inactive.capacity + channel.data.commitments.localCommit.spec.toLocal;
        }
      });
      lightningBalances = { localBalance: totalLocalBalance, remoteBalance: totalRemoteBalance };
      logger.info({fileName: 'Channels', msg: 'Lightning Balances: ' + JSON.stringify(lightningBalances)});
      activeChannels = common.sortDescByKey(activeChannels, 'balancedness');
      logger.info({fileName: 'Channels', msg: 'Active Channels: ' + JSON.stringify(activeChannels)});
      logger.info({fileName: 'Channels', msg: 'Pending Channels: ' + JSON.stringify(pendingChannels)});
      logger.info({fileName: 'Channels', msg: 'Inactive Channels: ' + JSON.stringify(inactiveChannels)});
      res.status(200).json({activeChannels: activeChannels, pendingChannels: pendingChannels, inactiveChannels: inactiveChannels, lightningBalances: lightningBalances, channelStatus: channelStatus});
    }
  })
  .catch(errRes => {
    console.warn(errRes);
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Channels', lineNum: 35, msg: 'Get Channels Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: 'Fetching Channels Failed!',
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
};

exports.getChannelStats = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channelstats';
  request.post(options).then((body) => { 
    logger.info({fileName: 'ChannelStats', msg: 'Channel Stats Response: ' + JSON.stringify(body)});
    res.status(201).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'ChannelStats', lineNum: 54, msg: 'Get Channel Stats Error: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Channel Stats Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });  
}

exports.openChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/open';
  options.form = req.body;
  logger.info({fileName: 'Channels', msg: 'Open Channel Params: ' + JSON.stringify(options.form)});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Open Channel Response: ' + JSON.stringify(body)});
    if(!body || body.error) {
      logger.error({fileName: 'Channels', lineNum: 140, msg: 'Open Channel Error: ' + ((!body || !body.error) ? 'Error From Server!' : JSON.stringify(body.error))});
      res.status(500).json({
        message: 'Open Channel Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Channels', lineNum: 58, msg: 'Open Channel Failed: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Open Channel Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
}

exports.updateChannelRelayFee = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/updaterelayfee';
  options.form = req.query;
  logger.info({fileName: 'Channels', msg: 'Update Relay Fee Params: ' + JSON.stringify(options.form)});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Update Relay Fee Response: ' + JSON.stringify(body)});
    res.status(201).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Channels', lineNum: 186, msg: 'Update Relay Fee Failed: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Update Relay Fee Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
}

exports.closeChannel = (req, res, next) => {
  options = common.getOptions();
  if (!req.query.force) {
    options.url = common.getSelLNServerUrl() + '/close';
  } else {
    options.url = common.getSelLNServerUrl() + '/forceclose';
  }
  options.form = req.query;
  logger.info({fileName: 'Channels', msg: 'Close Channel Params: ' + JSON.stringify(options.form)});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Close Channel Response: ' + JSON.stringify(body)});
    res.status(204).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.authorization) {
      delete err.options.headers.authorization;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.authorization) {
      delete err.response.request.headers.authorization;
    }
    logger.error({fileName: 'Channels', lineNum: 217, msg: 'Close Channel Failed: ' + JSON.stringify(err)});
    return res.status(err.statusCode ? err.statusCode : 500).json({
      message: "Close Channel Failed!",
      error: err.error && err.error.error ? err.error.error : err.error ? err.error : "Unknown Server Error"
    });
  });
}
