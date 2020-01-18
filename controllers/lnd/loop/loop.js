var request = require('request-promise');
var common = require('../../../common');
var logger = require('../../logger');
var options = {};
var loopServerUrl = common.getSelLoopServerUrl();

exports.loopIn = (req, res, next) => {
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options = common.getOptions();
  options.url = loopServerUrl + '/loop/out';
  options.form = JSON.stringify({ 
    // addr: { host: req.body.host, pubkey: req.body.pubkey },
    // perm: req.body.perm
  });
  request.post(options, (error, response, body) => {
    // logger.info({fileName: 'Peers', msg: 'Peer Added: ' + JSON.stringify(body)});
    // if(!body || body.error) {
    //   res.status(500).json({
    //     message: "Adding peer failed!",
    //     error: (!body) ? 'Error From Server!' : body.error
    //   });
    // } else {
    //   options.url = loopServerUrl + '/peers';
    //   request(options).then(function (body) {
    //     let peers = (!body.peers) ? [] : body.peers;
    //     Promise.all(
    //       peers.map(peer => {
    //         return getAliasForPeers(peer);
    //       }))
    //     .then(function(values) {
    //       if ( body.peers) {
    //         body.peers = common.sortDescByKey(body.peers, 'alias');
    //         logger.info({fileName: 'Peers', msg: 'Peer with Alias: ' + JSON.stringify(body)});
    //         body.peers = common.newestOnTop(body.peers, 'pub_key', req.body.pubkey);
    //         logger.info({fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(body)});
    //       }
    //       logger.info({fileName: 'Peers', msg: 'Peer Added Successfully'});
    //       res.status(201).json(body.peers);
    //     })
    //     .catch((err) => {
    //       return res.status(500).json({
    //         message: "Peer Add Failed!",
    //         error: err.error
    //       });
    //     });
    //   })
    // }
    res.status(201).json({});
  });  
};

exports.loopOut = (req, res, next) => {
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options = common.getOptions();
  options.url = loopServerUrl + '/loop/out';
  options.form = JSON.stringify({ 
    // addr: { host: req.body.host, pubkey: req.body.pubkey },
    // perm: req.body.perm
  });
  request.post(options, (error, response, body) => {
    // logger.info({fileName: 'Peers', msg: 'Peer Added: ' + JSON.stringify(body)});
    // if(!body || body.error) {
    //   res.status(500).json({
    //     message: "Adding peer failed!",
    //     error: (!body) ? 'Error From Server!' : body.error
    //   });
    // } else {
    //   options.url = loopServerUrl + '/peers';
    //   request(options).then(function (body) {
    //     let peers = (!body.peers) ? [] : body.peers;
    //     Promise.all(
    //       peers.map(peer => {
    //         return getAliasForPeers(peer);
    //       }))
    //     .then(function(values) {
    //       if ( body.peers) {
    //         body.peers = common.sortDescByKey(body.peers, 'alias');
    //         logger.info({fileName: 'Peers', msg: 'Peer with Alias: ' + JSON.stringify(body)});
    //         body.peers = common.newestOnTop(body.peers, 'pub_key', req.body.pubkey);
    //         logger.info({fileName: 'Peers', msg: 'Peer with Newest On Top: ' + JSON.stringify(body)});
    //       }
    //       logger.info({fileName: 'Peers', msg: 'Peer Added Successfully'});
    //       res.status(201).json(body.peers);
    //     })
    //     .catch((err) => {
    //       return res.status(500).json({
    //         message: "Peer Add Failed!",
    //         error: err.error
    //       });
    //     });
    //   })
    // }
    res.status(201).json({});
  });
};

exports.loopInTerms = (req, res, next) => {
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options = common.getOptions();
  options.url = loopServerUrl + '/loop/in/terms';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop In Terms: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Terms Failed!",
      error: err.error
    });
  });
};

exports.loopInQuote = (req, res, next) => {
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options = common.getOptions();
  options.url = loopServerUrl + '/loop/in/quote';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop In Quote: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop In Quote Failed!",
      error: err.error
    });
  });
};

exports.loopOutTerms = (req, res, next) => {
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options = common.getOptions();
  options.url = loopServerUrl + '/loop/out/terms';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Terms: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Terms Failed!",
      error: err.error
    });
  });
};

exports.loopOutQuote = (req, res, next) => {
  if(loopServerUrl === '') { return res.status(500).json({message: "Loop In Terms Failed!",error: { message: 'Loop Server URL is missing in the configuration.'}}); }
  options = common.getOptions();
  options.url = loopServerUrl + '/loop/out/quote';
  request(options).then(function (body) {
    logger.info({fileName: 'Loop', msg: 'Loop Out Quote: ' + JSON.stringify(body)});
    res.status(200).json(body);
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Loop Out Quote Failed!",
      error: err.error
    });
  });
};
