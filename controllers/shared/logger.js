var fs = require('fs');
var common = require('../../routes/common');

exports.log = (msgJSON, selNode = common.selectedNode) => {
  // console.log(msgJSON,"__+++__")
  // console.log(common, "++++")
  let msgStr = '\r\n[' + new Date().toISOString() + '] ' + msgJSON.level + ': ' + msgJSON.fileName + ' => ' + msgJSON.msg;
  switch (msgJSON.level) {
    case 'ERROR':
      msgStr = msgStr + ': ' + (msgJSON.error && typeof msgJSON.error === 'object' ? JSON.stringify(msgJSON.error) : (msgJSON.error && typeof msgJSON.error === 'string') ? msgJSON.error : '');
      console.error(msgStr);
      if (selNode) {
        // console.log("\nprinting errors")
        fs.appendFile(selNode.log_file, msgStr, function (err) {
          if (err) {
            return ({ error: 'Updating Log Failed!' });
          } else {
            return ({ message: 'Log Updated Successfully' });
          }
        });
      }
      break;

    case 'WARN':
      if (selNode && (selNode.logLevel == "INFO" || selNode.logLevel == "WARN" || selNode.logLevel == "DEBUG") && msgJSON.data) {
        msgStr = msgStr + ': ' + (msgJSON.data && typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (msgJSON.data && typeof msgJSON.data === 'string') ? msgJSON.data : '');
        if (msgJSON.fileName !== 'Config Setup Variable') { console.log(msgStr); }

        // console.log("\nprinting warns")
        fs.appendFile(selNode.log_file, msgStr, function (err) {
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

    case 'INFO':
      // console.log("\nprinting info", selNode.logLevel, msgJSON.data)
      if (selNode && (selNode.logLevel == "INFO" || selNode.logLevel == "DEBUG") && msgJSON.data) {
        msgStr = msgStr + ': ' + (msgJSON.data && typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (msgJSON.data && typeof msgJSON.data === 'string') ? msgJSON.data : '');
        if (msgJSON.fileName !== 'Config Setup Variable') { console.log(msgStr); }
        fs.appendFile(selNode.log_file, msgStr, function (err) {
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
      if (selNode && selNode.logLevel == "DEBUG") {
        if (msgJSON.data && typeof msgJSON.data !== 'string' && msgJSON.data.length && msgJSON.data.length > 0) {
          msgStr = msgJSON.data.reduce((accumulator, dataEle) => {
            return accumulator + (typeof dataEle === 'object' ? JSON.stringify(dataEle) : (typeof dataEle === 'string') ? dataEle : '') + ', ';
          }, msgStr + ': [');
          msgStr = msgStr.slice(0, -2) + ']';
        } else {
          msgStr = msgStr + ': ' + (msgJSON.data && typeof msgJSON.data === 'object' ? JSON.stringify(msgJSON.data) : (msgJSON.data && typeof msgJSON.data === 'string') ? msgJSON.data : '');
        }
        if (msgJSON.fileName !== 'Config Setup Variable') { console.log(msgStr); }
        // console.log("\nprinting debug")
      }
      break;

    default:
      console.log(msgStr, selNode);
      break
  }
}
