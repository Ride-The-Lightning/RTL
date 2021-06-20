var fs = require('fs');
var common = require('../../routes/common');

exports.log = (msgJSON, selNode = common.selectedNode) => {
  let msgStr = '\r\n[' + new Date().toISOString() + '] ' + msgJSON.level + ': ' +  msgJSON.fileName + ' => ' + msgJSON.msg;
  switch (msgJSON.level) {
    case 'ERROR':
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
      break;

    case 'INFO':
      console.log(msgStr);
      break;
  
    case 'DEBUG':
      if(selNode && selNode.enable_logging) {
        if (msgJSON.fileName !== 'Config Setup Variable') { console.log(msgStr); }
        fs.appendFile(selNode.log_file, msgStr, function(err) {
          if (err) {
            return ({ error: 'Updating Log Failed!' });
          } else {
            return ({ message: 'Log Updated Successfully' });
          }
        });
      }    
      break;

    default:
      console.log(msgStr, selNode);
      break
  }
}
