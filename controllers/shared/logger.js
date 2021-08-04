var fs = require('fs');
var common = require('../../routes/common');

exports.log = (msgJSON, selNode = common.selectedNode) => {
  let msgStr = '\r\n[' + new Date().toISOString() + '] ' + msgJSON.level + ': ' + msgJSON.fileName + ' => ' + msgJSON.msg;
  switch (msgJSON.level) {
    case 'ERROR':
      if (selNode && msgJSON.error) {
        msgStr = msgStr + ': ' + (typeof msgJSON.error === 'object' ? JSON.stringify(msgJSON.error) : (typeof msgJSON.error === 'string') ? msgJSON.error : '');
        console.error(msgStr);
        if (selNode) {
          fs.appendFile(selNode.log_file, msgStr, function (err) {
            if (err) {
              return ({ error: 'Updating Log Failed!' });
            } else {
              return ({ message: 'Log Updated Successfully' });
            }
          });
        }
      }
      break;

    case 'WARN':
      if (selNode && (selNode.logLevel == "INFO" || selNode.logLevel == "WARN" || selNode.logLevel == "DEBUG") && msgJSON.data) {
        msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '');
        console.warn(msgStr)
        fs.appendFile(selNode.log_file, msgStr, function (err) {
          if (err) {
            return ({ error: 'Updating Log Failed!' });
          } else {
            return ({ message: 'Log Updated Successfully' });
          }
        });
      }
      break;

    case 'INFO':
      if (selNode && (selNode.logLevel == "INFO" || selNode.logLevel == "DEBUG") && msgJSON.data) {
        msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (typeof msgJSON.data === 'string') ? msgJSON.data : '');
        console.log(msgStr);
        fs.appendFile(selNode.log_file, msgStr, function (err) {
          if (err) {
            return ({ error: 'Updating Log Failed!' });
          } else {
            return ({ message: 'Log Updated Successfully' });
          }
        });
      }
      break;

    case 'DEBUG':
      if (selNode && selNode.logLevel == "DEBUG" && msgJSON.data) {
        if (typeof msgJSON.data !== 'string' && msgJSON.data.length && msgJSON.data.length > 0) {
          msgStr = msgJSON.data.reduce((accumulator, dataEle) => {
            return accumulator + (typeof dataEle === 'object' ? JSON.stringify(dataEle) : (typeof dataEle === 'string') ? dataEle : '') + ', ';
          }, msgStr + ': [');
          msgStr = msgStr.slice(0, -2) + ']';
        } else {
          msgStr = msgStr + ': ' + (typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : msgJSON.data);
        }
        fs.appendFile(selNode.log_file, msgStr, function (err) {
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
