var request = require('request-promise');
var common = require('../../routes/common');
var logger = require('../shared/logger');
var options = {};

exports.listChannels = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Getting Channels..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channel/listChannels';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'List Channels', data: body});
    body.map(channel => {
      if (!channel.alias || channel.alias === '') { channel.alias = channel.id.substring(0, 20); }
      local = (channel.msatoshi_to_us) ? channel.msatoshi_to_us : 0;
      remote = (channel.msatoshi_to_them) ? channel.msatoshi_to_them : 0;
      total = channel.msatoshi_total ? channel.msatoshi_total : 0;
      channel.balancedness = (total == 0) ? 1 : (1 - Math.abs((local-remote)/total)).toFixed(3);
    })
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channels Received'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Channels', msg: 'List Channels Error', error: err});
    return res.status(500).json({
      message: 'Fetching List Channels Failed!',
      error: err.error
    });
  });
}

exports.openChannel = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Opening Channel..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channel/openChannel';
  options.body = req.body;
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Options', data: options.body});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Open Channel Response', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Open Channel Error', error: body.error});
      res.status(500).json({
        message: 'Open Channel Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel Opened'});
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Open Channel Error', error: err});
    return res.status(500).json({
      message: 'Open Channel Failed!',
      error: err.error
    });
  });
}

exports.setChannelFee = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Setting Channel Fee..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channel/setChannelFee';
  options.body = req.body;
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy Options', data: options.body});
  request.post(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Update Channel Policy', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Update Channel Policy Error', error: body.error});
      res.status(500).json({
        message: 'Update Channel Policy Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel Fee Set'});
      res.status(201).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Update Channel Policy Error', error: err});
    return res.status(500).json({
      message: 'Update Channel Policy Failed!',
      error: err.error
    });
  });
}

exports.closeChannel = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Closing Channel..'});
  req.setTimeout(60000 * 10); // timeout 10 mins
  options = common.getOptions();
  const unilateralTimeoutQuery = req.query.force ? '?unilateralTimeout=1' : '';
  options.url = common.getSelLNServerUrl() + '/v1/channel/closeChannel/' + req.params.channelId + unilateralTimeoutQuery;
  logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Closing Channel', data: options.url});
  request.delete(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Close Channel Response', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Close Channel Error', error: body.error});
      res.status(500).json({
        message: 'Close Channel Failed!',
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel Closed'});
      res.status(204).json(body);
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Close Channel Error', error: err});
    return res.status(500).json({
      message: 'Close Channel Failed!',
      error: err.error
    });
  });  
}

exports.getLocalRemoteBalance = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Getting Local & Remote Balances..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channel/localremotebal';
  request(options).then(function (body) {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Local Remote Balance', data: body});
    if(!body.localBalance) {
      body.localBalance = 0;
    }
    if(!body.remoteBalance) {
      body.remoteBalance = 0;
    }
    logger.log({level: 'INFO', fileName: 'Channels', msg: 'Local & Remote Balances Received'});
    res.status(200).json(body);
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Local Remote Balance Error', error: err});
    return res.status(500).json({
      message: 'Fetching Local Remote Balance Failed!',
      error: err.error
    });
  });
};

exports.listForwards = (req, res, next) => {
  logger.log({level: 'INFO', fileName: 'Channels', msg: 'Getting Channel List Forwards..'});
  options = common.getOptions();
  options.url = common.getSelLNServerUrl() + '/v1/channel/listForwards/';
  request.get(options).then((body) => {
    logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Forwarding History Response', data: body});
    if(!body || body.error) {
      logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Forwarding History Error', error: body.error});
      res.status(500).json({
        message: "Forwarding History Failed!",
        error: (!body) ? 'Error From Server!' : body.error
      });
    } else {
      if (body && body.length > 0) {
        body = common.sortDescByKey(body, 'received_time');
      }
      logger.log({level: 'DEBUG', fileName: 'Channels', msg: 'Forwarding History Received', data: body});
      logger.log({level: 'INFO', fileName: 'Channels', msg: 'Channel List Forwards Received'});
      res.status(200).json({ last_offset_index: 0, forwarding_events: body });
    }
  })
  .catch(errRes => {
    let err = JSON.parse(JSON.stringify(errRes));
    if (err.options && err.options.headers && err.options.headers.macaroon) {
      delete err.options.headers.macaroon;
    }
    if (err.response && err.response.request && err.response.request.headers && err.response.request.headers.macaroon) {
      delete err.response.request.headers.macaroon;
    }
    logger.log({level: 'ERROR', fileName: 'Channels', msg: 'Forwarding History Error', error: err});
    return res.status(500).json({
      message: "Forwarding History Failed!",
      error: err.error
    });
  });
};
