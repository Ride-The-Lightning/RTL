var fs = require('fs');
var config = require('./config');
var clArgs = require('optimist').argv;

if(undefined !== clArgs.lndir) {
  config.lnd_dir = clArgs.lndir;
} else {
  if(config.lnd_dir === '') {
    config.lnd_dir = __dirname;
  }
}

var macaroon = fs.readFileSync(config.lnd_dir + '/admin.macaroon').toString('hex');
var options = {
  url: '',
  rejectUnauthorized: false,
  json: true,
  headers: {
    'Grpc-Metadata-macaroon': macaroon,
  },
  form: ''
};

module.exports = options;