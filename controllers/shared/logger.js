var fs = require('fs');
var common = require('../../common');

exports.info = (msgJSON, selNode = common.selectedNode) => {
  const msgStr = '\r\nINFO: ' +  msgJSON.fileName + ' => ' + msgJSON.msg;
  if (msgJSON.fileName !== 'Config Setup Variable') {
    console.log(msgStr);
  }
  if(selNode && selNode.enable_logging) {
    fs.appendFile(selNode.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}

exports.error = (msgJSON, selNode = common.selectedNode) => {
  const msgStr = '\r\nERROR: ' +  msgJSON.fileName + '(' + msgJSON.lineNum + ') => ' + msgJSON.msg;
  console.error(msgStr);
  if(selNode && selNode.enable_logging) {
    fs.appendFile(selNode.log_file, msgStr, function(err) {
      if (err) {
        return ({ error: 'Updating Log Failed!' });
      } else {
        return ({ message: 'Log Updated Successfully' });
      }
    });
  }
}
