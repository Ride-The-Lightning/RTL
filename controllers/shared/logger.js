var fs = require('fs');
var common = require('../../routes/common');

exports.log = (msgJSON, selNode = common.selectedNode) => {
  let msgStr = '\r\n[' + new Date().toISOString() + '] ' + msgJSON.level + ': ' +  msgJSON.fileName + ' => ' + msgJSON.msg;
  switch (msgJSON.level) {
    case 'ERROR':
      msgStr = msgStr + ': ' + (msgJSON.error && typeof msgJSON.error === 'object' ? JSON.stringify(msgJSON.error) : (msgJSON.error && typeof msgJSON.error === 'string') ? msgJSON.error : '');
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
      if(selNode && selNode.enable_logging && msgJSON.data) {
        msgStr = msgStr + ': ' + (msgJSON.data && typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (msgJSON.data && typeof msgJSON.data === 'string') ? msgJSON.data : '');
        if (msgJSON.fileName !== 'Config Setup Variable') { console.log(msgStr); }
        fs.appendFile(selNode.log_file, msgStr, function(err) {
          if (err) {
            return ({ error: 'Updating Log Failed!' });
          } else {
            return ({ message: 'Log Updated Successfully' });
          }
        });
      } else {
        console.log(msgStr + '.');
      }
      break;
  
    case 'DEBUG':
      if(selNode && selNode.enable_logging) {
        if (msgJSON.data && msgJSON.data.length && msgJSON.data.length > 0) {
          msgStr = msgJSON.data.reduce((accumulator, dataEle) => {
            return accumulator + (typeof dataEle === 'object' ? JSON.stringify(dataEle) : (typeof dataEle === 'string') ? dataEle : '') + ', ';
          }, msgStr + ': [');
          msgStr = msgStr.slice(0, -2) + ']';
        } else {
          msgStr = msgStr + ': ' + (msgJSON.data && typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (msgJSON.data && typeof msgJSON.data === 'string') ? msgJSON.data : '');
        }
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
