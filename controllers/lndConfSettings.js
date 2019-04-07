var fs = require('fs');

exports.getLNDSettings = (req, res, next) => {
  fs.readFile(req.headers.filepath, function(err, data) {
    if (err) {
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      res.status(200).json(data.toString('utf8'));
    }
  });
};
