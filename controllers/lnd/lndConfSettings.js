var fs = require('fs');

exports.getLNDSettings = (req, res, next) => {
  fs.readFile(req.headers.filepath, function(err, data) {
    if (err) {
      if (err.options && err.options.headers && err.options.headers['Grpc-Metadata-macaroon']) {
        delete err.options.headers['Grpc-Metadata-macaroon'];
      }
      if (err.response && err.response.request && err.response.request.headers && err.response.request.headers['Grpc-Metadata-macaroon']) {
        delete err.response.request.headers['Grpc-Metadata-macaroon'];
      }
      logger.error({fileName: 'LNDConfSetting', lineNum: 12, msg: 'Reading Config File Error: ' + JSON.stringify(err)});
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      res.status(200).json(data.toString('utf8'));
    }
  });
};
