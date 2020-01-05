var request = require('request-promise');
var common = require('../../common');
var logger = require('../logger');
var options = {};

exports.listChannels = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channel/listChannels';
  request(options).then(function (body) {
    logger.info({fileName: 'Channels', msg: 'List Channels: ' + JSON.stringify(body)});
    body.map(channel => {
      local = (channel.msatoshi_to_us) ? channel.msatoshi_to_us : 0;
      remote = (channel.msatoshi_to_them) ? channel.msatoshi_to_them : 0;
      total = channel.msatoshi_total ? channel.msatoshi_total : 0;
      channel.balancedness = (1 - Math.abs((local-remote)/total)).toFixed(3);
    })    
    res.status(200).json(body);
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 14, msg: 'List Channels: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching List Channels Failed!',
      error: err.error
    });
  });
}

exports.openChannel = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channel/openChannel';
  options.body = req.body;
  logger.info({fileName: 'Channels', msg: 'Open Channel Options: ' + JSON.stringify(options.body)});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Open Channel Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'Open Channel Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 39, msg: 'Open Channel Failed: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Open Channel Failed!',
      error: err.error
    });
  });
}

exports.setChannelFee = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channel/setChannelFee';
  options.body = req.body;
  logger.info({fileName: 'Channels', msg: 'Update Channel Policy Options: ' + JSON.stringify(options.body)});
  request.post(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Update Channel Policy: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'Update Channel Policy Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 211, msg: 'Update Channel Policy: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Update Channel Policy Failed!',
      error: err.error
    });
  });
}

exports.closeChannel = (req, res, next) => {
  options = common.getOptions();
  const unilateralTimeoutQuery = req.query.unilateralTimeout ? '?unilateralTimeout=' + req.query.unilateralTimeout : '';
  options.url = common.getSelLNServerUrl() + '/channel/closeChannel/' + req.params.channelId + unilateralTimeoutQuery;
  logger.info({fileName: 'Channels', msg: 'Closing Channel: ' + options.url});
  request.delete(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Close Channel Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      res.status(500).json({
        message: 'Close Channel Failed!',
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(204).json(body);
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 41, msg: 'Close Channel: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Close Channel Failed!',
      error: err.error
    });
  });  
}

exports.getLocalRemoteBalance = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channel/localremotebal';
  request(options).then(function (body) {
    logger.info({fileName: 'Channels', msg: 'Local Remote Balance: ' + JSON.stringify(body)});
    if(undefined === body.localBalance) {
      body.localBalance = 0;
      body.btc_localBalance = 0;
    } else {
      body.btc_localBalance = common.convertToBTC(body.localBalance);
    }
    if(undefined === body.remoteBalance) {
      body.remoteBalance = 0;
      body.btc_remoteBalance = 0;
    } else {
      body.btc_remoteBalance = common.convertToBTC(body.remoteBalance);
    }

    res.status(200).json(body);
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 14, msg: 'Local Remote Balance: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: 'Fetching Local Remote Balance Failed!',
      error: err.error
    });
  });
};

exports.listForwards = (req, res, next) => {
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/channel/listForwards/';
  request.get(options).then((body) => {
    logger.info({fileName: 'Channels', msg: 'Forwarding History Response: ' + JSON.stringify(body)});
    if(undefined === body || body.error) {
      logger.error({fileName: 'Channels', lineNum: 27, msg: 'Forwarding History Error: ' + JSON.stringify((undefined === body) ? 'Error From Server!' : body.error)});
      res.status(500).json({
        message: "Forwarding History Failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      if (body && body.length > 0) {
        body.forEach(event => {
          event.received_time_str =  (undefined === event.received_time) ? '' : common.convertTimestampToDate(event.received_time);
          event.resolved_time_str =  (undefined === event.resolved_time) ? '' : common.convertTimestampToDate(event.resolved_time);
        });
        body = common.sortDescByKey(body, 'received_time');
      }
      logger.info({fileName: 'Channels', msg: 'Forwarding History Received: ' + JSON.stringify(body)});
      res.status(200).json({ last_offset_index: 0, forwarding_events: body });
    }
  })
  .catch(function (err) {
    logger.error({fileName: 'Channels', lineNum: 44, msg: 'Forwarding History Error: ' + JSON.stringify(err)});
    return res.status(500).json({
      message: "Forwarding History Failed!",
      error: err.error
    });
  });
};
