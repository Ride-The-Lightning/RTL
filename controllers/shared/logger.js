var fs = require('fs');
var common = require('../../routes/common');

exports.log = (msgJSON, selNode = common.selectedNode) => {
  let msgStr = '\r\n[' + new Date().toISOString() + '] ' + msgJSON.level + ': ' + msgJSON.fileName + ' => ' + msgJSON.msg;
  switch (msgJSON.level) {
    case 'ERROR':
      if (selNode) {
        msgStr = msgStr + ': ' + (typeof msgJSON.error === 'object' ? JSON.stringify(msgJSON.error) : (typeof msgJSON.error === 'string') ? msgJSON.error : '');
        console.error(msgStr);
        fs.appendFile(selNode.log_file, msgStr, () => {});
      }
      break;

    case 'WARN':
      if (selNode && (selNode.log_level == "INFO" || selNode.log_level == "WARN" || selNode.log_level == "DEBUG")) {
        msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '');
        console.warn(msgStr)
        fs.appendFile(selNode.log_file, msgStr, () => {});
      }
      break;

    case 'INFO':
      if (selNode && (selNode.log_level == "INFO" || selNode.log_level == "DEBUG")) {
        msgStr = msgStr + '. ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '');
        console.log(msgStr);
        fs.appendFile(selNode.log_file, msgStr, () => {});
      }
      break;

    case 'DEBUG':
      if (selNode && selNode.log_level == "DEBUG") {
        if (typeof msgJSON.data !== 'string' && msgJSON.data && msgJSON.data.length && msgJSON.data.length > 0) {
          msgStr = msgJSON.data.reduce((accumulator, dataEle) => {
            return accumulator + (typeof dataEle === 'object' ? JSON.stringify(dataEle) : (typeof dataEle === 'string') ? dataEle : '') + ', ';
          }, msgStr + ': [');
          msgStr = msgStr.slice(0, -2) + ']';
        } else {
          if (msgJSON.data && msgJSON.data !== '') {
            msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : typeof msgJSON.data == 'string' ? msgJSON.data : '');
          }
        }
        console.log(msgStr);
        fs.appendFile(selNode.log_file, msgStr, () => {});
      }
      break;

    default:
      console.log(msgStr, selNode);
      break
  }
}
