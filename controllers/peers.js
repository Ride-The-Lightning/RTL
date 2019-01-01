var fs = require('fs');
var request = require('request-promise');
var options = require("../connect");
var common = require('../common');

getAliasForPeers = (peer) => {
  return new Promise(function(resolve, reject) {
    options.url = common.lnd_server_url + '/graph/node/' + peer.pub_key;
    request(options)
    .then(function(aliasBody) {
      console.log('Alias: ' + JSON.stringify(aliasBody.node.alias));
      peer.alias = aliasBody.node.alias;
      resolve(aliasBody.node.alias);
    })
    .catch(err => resolve(''));
  });
}

exports.getPeers = (req, res, next) =>
{
  options.url = common.lnd_server_url + '/peers';
  request(options).then(function (body) {
    let peers = (undefined === body.peers) ? [] : body.peers;
    Promise.all(
      peers.map(peer => {
        return getAliasForPeers(peer);
      }))
    .then(function(values) {
      console.log(`\nPeers Fetched with Alias: ${JSON.stringify(body)}`);
      res.status(200).json(body.peers);
    });
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Peers Fetched Failed!",
      error: err.error
    });
  });
};

exports.postPeer = (req, res, next) => {
  options.url = common.lnd_server_url + '/peers';
  options.form = JSON.stringify({ 
    addr: { host: req.body.host, pubkey: req.body.pubkey },
    perm: req.body.perm
  });
  console.log('Options: ' + JSON.stringify(options));
  request.post(options, (error, response, body) => {
    console.log('Peer Add Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Adding peer failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      options.url = common.lnd_server_url + '/peers';
      request(options).then(function (body) {
        let peers = (undefined === body.peers) ? [] : body.peers;
        Promise.all(
          peers.map(peer => {
            return getAliasForPeers(peer);
          }))
        .then(function(values) {
          console.log(`\nPeer Added Succesfully!`);
          console.log(`\nPeers Fetched with Alias: ${JSON.stringify(body)}`);
          res.status(201).json(body.peers);
        })
        .catch((err) => {
          return res.status(500).json({
            message: "Peer Add Failed!",
            error: err.error
          });
        });
      })
    }
  });
};

exports.deletePeer = (req, res, next) => {
  options.url = common.lnd_server_url + '/peers/' + req.params.peerPubKey;
  console.log('Detach Peer Options: ');
  console.log(options.url);
  request.delete(options).then((body) => {
    console.log('Detach Peer Response: ');
    console.log(body);
    if(undefined === body || body.error) {
      res.status(500).json({
        message: "Detach peer failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      console.log('\nPeer Detached: ' + req.params.peerPubKey);
      res.status(204).json({});
    }
  })
  .catch((err) => {
    return res.status(500).json({
      message: "Detach Peer Failed!",
      error: err.error
    });
  });
};