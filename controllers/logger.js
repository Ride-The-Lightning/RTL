var fs = require('fs');
var common = require('../common');

exports.info = (msgStr) => {
  console.log('Console: ' + msgStr);
  if(common.enable_logging) {
    fs.appendFile(common.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}

exports.error = (msgStr) => {
  console.error('Console: ' + msgStr);
  if(common.enable_logging) {
    fs.appendFile(common.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}