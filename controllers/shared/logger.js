var fs = require('fs');
const selNode = require('../../routes/common').selectedNode;

exports.log = (msgJSON) => {
  switch (msgJSON.level) {
    case 'INFO':
      if(selNode && !selNode.enable_logging) {
        if (msgJSON.fileName !== 'Config Setup Variable') { 
          console.log('\r\n[' + new Date().toISOString() + '] INFO: ' +  msgJSON.fileName + ' => ' + msgJSON.msg);
        }
      }
      break;
  
    case 'DEBUG':
      if(selNode && selNode.enable_logging) {
        const msgStr = '\r\n[' + new Date().toISOString() + '] DEBUG: ' +  msgJSON.fileName + ' => ' + msgJSON.msg;
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
      const msgStr = '\r\n[' + new Date().toISOString() + '] DEBUG: ' +  msgJSON.fileName + ' => ' + msgJSON.msg;
      console.log(msgStr);
      break
  }
}

exports.error = (msgJSON) => {
  const msgStr = '\r\n[' + new Date().toISOString() + '] ERROR: ' +  msgJSON.fileName + '(' + msgJSON.lineNum + ') => ' + msgJSON.msg;
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
