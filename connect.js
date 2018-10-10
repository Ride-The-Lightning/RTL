var fs = require('fs');
var common = require('./common');
var clArgs = require('optimist').argv;

if(undefined !== clArgs.lndir) {
  common.lnd_dir = clArgs.lndir;
} else {
  if(common.lnd_dir === '') {
    common.lnd_dir = __dirname;
  }
}

var macaroon = fs.readFileSync(common.lnd_dir + '/admin.macaroon').toString('hex');
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