var fs = require('fs');

exports.getLNDSettings = (req, res, next) => {
  console.log('Getting LND Conf Settings!');
  fs.readFile(req.headers.filepath, function(err, data) {
    if (err) {
      console.log('Reading Config File Failed!');
      res.status(500).json({
        message: "Reading Config File Failed!",
        error: err
      });
    } else {
      console.log('LND Conf read successfully');
      res.status(200).json(data.toString('utf8'));
    }
  });
};
