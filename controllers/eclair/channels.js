var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.getChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channels';
  if (req.query && req.query.nodeId) {
    options.qs = req.query.nodeId;
    logger.info({fileName: 'Channels', msg: 'Channels Node Id: ' + req.query.nodeId});
  }
  request.post(options).then(function (body) {
    logger.info({fileName: 'Channels', msg: 'All Channels: ' + JSON.stringify(body)});
    if(body) {
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
      body.map(channel => {
        channel.alias = 'Node Alias';
        if (channel.state === 'NORMAL') {
          local = (channel.data.commitments.localCommit.spec.toLocal) ? +channel.data.commitments.localCommit.spec.toLocal : 0;
          remote = (channel.data.commitments.localCommit.spec.toRemote) ? +channel.data.commitments.localCommit.spec.toRemote : 0;
          channelTotal = local + remote;
          totalLocalBalance = totalLocalBalance + local;
          totalRemoteBalance = totalRemoteBalance + remote;
          channel.balancedness = (channelTotal == 0) ? 1 : (1 - Math.abs((local-remote)/channelTotal)).toFixed(3);
          activeChannels.push(channel);
          channelStatus.active.channels = channelStatus.active.channels + 1;
          channelStatus.active.capacity = channelStatus.active.capacity + channel.data.commitments.localCommit.spec.toLocal;
        } else if (channel.state.includes('WAIT')) {
          channelStatus.pending.channels = channelStatus.pending.channels + 1;
          channelStatus.pending.capacity = channelStatus.pending.capacity + channel.data.commitments.localCommit.spec.toLocal;
        } else {
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
    body = [
      {
        "channelId": "57d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0e",
        "avgPaymentAmount": 123,
        "paymentCount": 55,
        "relayFee": 3,
        "networkFee": 3382
      },
      {
        "channelId": "58d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0f",
        "avgPaymentAmount": 124,
        "paymentCount": 65,
        "relayFee": 1,
        "networkFee": 3383
      },
      {
        "channelId": "59d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0g",
        "avgPaymentAmount": 125,
        "paymentCount": 75,
        "relayFee": 2,
        "networkFee": 3384
      },
      {
        "channelId": "60d7d6eda04d80138270c49709f1eadb5ab4939e5061309ccdacdb98ce637d0h",
        "avgPaymentAmount": 126,
        "paymentCount": 85,
        "relayFee": 3,
        "networkFee": 3385
      }
    ];
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

