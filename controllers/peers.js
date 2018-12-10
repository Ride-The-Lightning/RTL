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
    .catch(err => reject(err));
  });
}

exports.getPeers = (req, res, next) => {
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
  });
};

exports.postPeer = (req, res, next) => {
  // setTimeout(()=>{res.status(201).json({message: 'Peer Added!'});}, 5000);
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
        message: "Adding peers failed!",
        error: (undefined === body) ? 'Error From Server!' : body.error
      });
    } else {
      res.status(201).json({message: 'Peer Added!'});
    }
  });
};
