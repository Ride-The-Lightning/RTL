var fs = require('fs');
var common = require('../common');

exports.info = (msgStr, selNode = {}) => {
  if (msgStr.indexOf('Config Setup Variable') === -1) {
    console.log('Console: ' + msgStr);
  }
  if(!common.multi_node_setup && common.enable_logging) {
    fs.appendFile(common.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }

  if(common.multi_node_setup && selNode.enable_logging) {
    fs.appendFile(selNode.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}

exports.error = (msgStr, selNode = {}) => {
  console.error('Console: ' + msgStr);
  if(!common.multi_node_setup && common.enable_logging) {
    fs.appendFile(common.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }

  if(common.multi_node_setup && selNode.enable_logging) {
    fs.appendFile(selNode.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}