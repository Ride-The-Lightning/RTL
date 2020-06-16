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
    logger.info({fileName: 'Channels', msg: 'Channels Received: ' + JSON.stringify(body)});
    if(body) {
      body.map(channel => {
        local = (channel.data.commitments.localCommit.spec.toLocal) ? +channel.data.commitments.localCommit.spec.toLocal : 0;
        remote = (channel.data.commitments.localCommit.spec.toRemote) ? +channel.data.commitments.localCommit.spec.toRemote : 0;
        total = local + remote;
        channel.balancedness = (total == 0) ? 1 : (1 - Math.abs((local-remote)/total)).toFixed(3);
      });
      body = common.sortDescByKey(body, 'balancedness');
      logger.info({fileName: 'Channels', msg: 'All Channels: ' + JSON.stringify(body)});
      res.status(200).json(body);
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

