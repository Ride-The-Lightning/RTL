var fs = require('fs');
var common = require('../common');

exports.info = (msgStr, selNode = common.selectedNode) => {
  if (msgStr.indexOf('Config Setup Variable') === -1) {
    console.log('Console: ' + msgStr);
  }
  if(selNode.enable_logging) {
    fs.appendFile(selNode.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}

exports.error = (msgStr, selNode = common.selectedNode) => {
  console.error('Console: ' + msgStr);
  if(selNode.enable_logging) {
    fs.appendFile(selNode.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}