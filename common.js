var fs = require('fs');
var crypto = require('crypto');
var path = require('path');
var common = {};

common.rtl_conf_file_path = '';
common.rtl_pass = '';
common.rtl_secret2fa = '';
common.rtl_sso = 0;
common.port = 3000;
common.host = null;
common.rtl_cookie_path = '';
common.logout_redirect_link = '/login';
common.cookie = '';
common.secret_key = crypto.randomBytes(64).toString('hex');
common.nodes = [];
common.selectedNode = {};

common.getSwapServerOptions = () => {
  return {
    url: common.selectedNode.swap_server_url,
    rejectUnauthorized: false,
    json: true
  };
};

common.getSelLNServerUrl = () => {
  return common.selectedNode.ln_server_url;
};

common.getOptions = () => {
  common.selectedNode.options.method = common.selectedNode.ln_implementation.toUpperCase() !== 'ECL' ? 'GET' : 'POST';
  delete common.selectedNode.options.form;
  common.selectedNode.options.qs = {};
  return common.selectedNode.options;
};

common.updateSelectedNodeOptions = () => {
  if (!common.selectedNode) {
    common.selectedNode = {};
  }
  common.selectedNode.options = {
    url: '',
    rejectUnauthorized: false,
    json: true,
    form: null
  };
  try {
    if (common.selectedNode && common.selectedNode.ln_implementation) {
      switch (common.selectedNode.ln_implementation.toUpperCase()) {
        case 'CLT':
          common.selectedNode.options.headers = { 'macaroon': Buffer.from(fs.readFileSync(path.join(common.selectedNode.macaroon_path, 'access.macaroon'))).toString("base64") };
          break;
      
        case 'ECL':
          common.selectedNode.options.headers = { 'authorization': 'Basic ' + Buffer.from(':' + common.selectedNode.ln_api_password).toString('base64') };
          break;

        default:
          common.selectedNode.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(path.join(common.selectedNode.macaroon_path, 'admin.macaroon')).toString('hex') };
          break;
      }
    }
    return { status: 200, message: 'Updated Successfully!' };
  } catch(err) {
    common.selectedNode.options = {
      url: '',
      rejectUnauthorized: false,
      json: true,
      form: null
    };
    console.error('Common Update Selected Node Options Error:' + JSON.stringify(err));    
    return { status: 502, message: err };
  }
}

common.setOptions = () => {
  if ( common.nodes[0].options &&  common.nodes[0].options.headers) { return; }
  if (common.nodes && common.nodes.length > 0) {
    common.nodes.forEach(node => {
      node.options = {
        url: '',
        rejectUnauthorized: false,
        json: true,
        form: null
      };
      try {
        if (node.ln_implementation) {
          switch (node.ln_implementation.toUpperCase()) {
            case 'CLT':
              node.options.headers = { 'macaroon': Buffer.from(fs.readFileSync(path.join(node.macaroon_path, 'access.macaroon'))).toString("base64") };
              break;
          
            case 'ECL':
              node.options.headers = { 'authorization': 'Basic ' + Buffer.from(':' + node.ln_api_password).toString('base64') };
              break;

            default:
              node.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(path.join(node.macaroon_path, 'admin.macaroon')).toString('hex') };
              break;
          }
        }
      } catch (err) {
        console.error('Common Set Options Error:' + JSON.stringify(err));
        node.options = {
          url: '',
          rejectUnauthorized: false,
          json: true,
          form: ''
        };
      }
    });
    common.updateSelectedNodeOptions();        
  }
}

common.findNode = (selNodeIndex) => {
  return common.nodes.find(node => node.index == selNodeIndex);
}

common.replaceNode = (selNodeIndex, newNode) => {
  common.nodes.splice(common.nodes.findIndex((node) => {node.index == selNodeIndex}), 1, newNode);
  common.selectedNode = common.findNode(selNodeIndex);
}

common.convertToBTC = (num) => {
  return (num / 100000000).toFixed(6);
};

common.convertTimestampToDate = (num) => {
  return new Date(+num * 1000).toUTCString().substring(5, 22).replace(' ', '/').replace(' ', '/').toUpperCase();
};

common.sortAscByKey = (array, key) => {
  return array.sort(function (a, b) {
    var x = +a[key]; var y = +b[key];
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

common.sortDescByKey = (array, key) => {
  const temp = array.sort(function (a, b) {
    var x = +a[key]; var y = +b[key];
    return (x > y) ? -1 : ((x < y) ? 1 : 0);
  });
  return temp;
}

common.sortAscByStrKey = (array, key) => {
  return array.sort(function (a, b) {
    var x = a[key] ? a[key].toUpperCase() : ''; var y = b[key] ? b[key].toUpperCase() : '';
    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
  });
}

common.sortDescByStrKey = (array, key) => {
  const temp = array.sort(function (a, b) {
    var x = a[key] ? a[key].toUpperCase() : ''; var y = b[key] ? b[key].toUpperCase() : '';
    return (x > y) ? -1 : ((x < y) ? 1 : 0);
  });
  return temp;
}

common.newestOnTop = (array, key, value) => {
  var index = array.findIndex(function (item) {
    return item[key] === value
  });
  var newlyAddedRecord = array.splice(index, 1);
  array.unshift(newlyAddedRecord[0]);
  return array;
}

common.parseHocon = (text) => {
  // Credit hocon-js https://www.npmjs.com/package/hocon-parser
  var index = 0;
  var result = readHocon(text);
  return handleSubtitutions(result);

  function readHocon(hoconText) {
    var isInQuotes = false;
    var quotesType = '';
    var isEscaping = false;

    var isInCurly = false;
    var isInArray = false;
    var isReadingValue = false;
    var isReadSeperator = false;
    var isInlineComment = false;
    var possibleComment = false;
    var isInMultilineString = false;
    var currentKey = '';
    var currentValue = '';
    var obj = {};

    while (index < hoconText.length) {
      var c = hoconText[index];
      index++;

      if (isInlineComment && !isInMultilineString) {
        if (c === '\r' || c === '\n') {
          isInlineComment = false;
        }
        continue;
      }

      if (!isEscaping && c === '"') {
        if ((index + 1 < hoconText.length) && hoconText[index] === '"' &&
          hoconText[index + 1] === '"') {
          if (isInMultilineString) {
            setValue();
            isInMultilineString = false;
            isInQuotes = false;
            isReadingValue = false;
            index += 2;
            // TODO: if this is followed by another quote, then it's not over..
            continue;
          }

          isInMultilineString = true;
          isInQuotes = true;
          isReadingValue = true;
          index += 2;
          continue;
        }
      }

      if (!isEscaping && !isInMultilineString && (c === '\'' || c === '"')) {
        if (isInQuotes && quotesType === c) {
          if (isReadingValue)
            setValue();
          else {
            isReadingValue = true;
          }
          isInQuotes = false;
          continue;
        }

        isInQuotes = true;
        quotesType = c;
        continue;
      }

      if (isInMultilineString && escapeInMultiLine(c)) {
        currentValue += c;
        continue;
      }

      if (isInQuotes && c === '\\') {
        isEscaping = true;
        continue;
      }

      isEscaping = false;

      if (!isInQuotes)
        switch (c) {
          case ' ':
            {
              if (currentKey !== '' && !isReadingValue) {
                currentKey += c;
                continue;
              }
              if (currentValue === '')
                continue;
              if (isInArray && isReadingValue) {
                currentValue += c;
                continue;
              }
            }
          case '\t':
          case '\r':
          case '\n':
            {
              if (isInArray && isReadingValue) {
                if (currentValue === '')
                  continue;

                setValue();
                continue;
              }

              if (!currentKey)
                continue;

              if (!isReadingValue) {
                isReadingValue = true;
                continue;
              }

              if (isReadingValue && currentValue) {
                setValue();
                continue;
              }

              continue;
            }
          case '{':
            {
              if (isInCurly || isInArray || currentKey) {
                index--;
                currentKey = currentKey.trim();
                currentValue = readHocon(hoconText);
                setValue();
                continue;
              }

              isInCurly = true;
              continue;
            }
          case '}':
            {
              if (!isInCurly)
                throw 'What';

              if (currentValue)
                setValue();
              else if (currentKey)
                return currentKey;

              return obj;
            }
          case ':':
          case '=':
            {
              if (isReadSeperator)
                throw 'Already met seperator';
              isReadingValue = true;
              isReadSeperator = true;

              currentKey = currentKey.trim();

              continue;
            }
          case ',':
            {
              if (isReadingValue && currentValue)
                setValue();
              continue;
            }
          case '[':
            {
              if (isInCurly || isInArray || currentKey) {
                index--;
                currentValue = readHocon(hoconText);
                setValue();
                continue;
              }
              isReadingValue = true;
              isInArray = true;
              obj = [];
              continue;
            }
          case ']':
            {
              if (!isInArray)
                throw 'not in an array';

              if (currentValue) {
                currentValue = currentValue.trim();
                setValue();
              }

              return obj;
            }
          case '$':
            {
              if (!currentValue) {
                currentValue = '${' + readHocon(hoconText) + '}';
                setValue();
                continue;
              }
              break;
            }
          case '#':
            {
              isInlineComment = true;
              continue;
            }
          case '/':
            {
              if (possibleComment) {
                isInlineComment = true;
                possibleComment = false;
                continue;
              }
              possibleComment = true;
              continue;
            }
        }

      if (isReadingValue) {
        currentValue += c;
      } else {
        currentKey += c;
      }
    }
    if (isInCurly)
      throw 'Expected closing curly bracket';

    if (isInArray)
      throw 'Expected closing square bracket';

    if (isReadingValue) {
      setValue();
    }
    return obj;

    function escapeInMultiLine(char) {
      return ['"', '\\'].indexOf(char) !== -1;
    }

    function setValue(key, objt) {
      var key = key || currentKey;
      var objt = objt || obj;
      var dotIndex = key.indexOf('.');
      if (!isInArray && dotIndex > 0) {
        var partKey = key.substring(0, dotIndex);
        objt[partKey] = objt[partKey] || {};
        setValue(key.substring(dotIndex + 1), objt[partKey]);
        return;
      }

      if (!isInQuotes && typeof currentValue === 'string') {
        if (/^\d+$/.test(currentValue))
          currentValue = parseInt(currentValue);
        else if (/^\d+\.\d+$/.test(currentValue))
          currentValue = parseFloat(currentValue);
        else if (currentValue === 'true')
          currentValue = true;
        else if (currentValue === 'false')
          currentValue = false;
        else if (currentValue === 'null')
          currentValue = null;
      }

      if (isInArray) {
        objt.push(currentValue);
      } else {
        if (typeof objt[key] === 'object' && typeof currentValue === 'object')
          extend(objt[key], currentValue)
        else
          objt[key] = currentValue;
        isReadingValue = false;
      }
      isReadSeperator = false;
      currentKey = '';
      currentValue = '';
    }
  }

  function handleSubtitutions(mainObj, intermidiateObj, loops) {
    loops = loops || 0;
    if (loops > 8)
      return null;

    intermidiateObj = typeof intermidiateObj === 'undefined' ? mainObj :
      intermidiateObj;
    if (intermidiateObj == null)
      return intermidiateObj;

    if (Array.isArray(intermidiateObj)) {
      intermidiateObj.forEach(function(element, index) {
        intermidiateObj[index] = handleSubtitutions(mainObj, element);
      });
    } else if (typeof intermidiateObj === 'string') {
      var match = /^\$\{(.+?)\}$/.exec(intermidiateObj);
      if (match && match.length == 2) {
        var val = eval('mainObj.' + match[1]);
        if (typeof val === 'undefined')
          return null;
        return handleSubtitutions(mainObj, val, loops + 1);
      }
    } else if (typeof intermidiateObj === 'object') {
      Object.keys(intermidiateObj).forEach(function(key, index) {
        intermidiateObj[key] = handleSubtitutions(mainObj, intermidiateObj[
          key]);
      });
    }

    return intermidiateObj;
  }

  function extend() {
    for (var i = 1; i < arguments.length; i++)
      for (var key in arguments[i])
        if (arguments[i].hasOwnProperty(key)) {
          if (typeof arguments[0][key] === 'object' && typeof arguments[i][key] ===
            'object')
            extend(arguments[0][key], arguments[i][key]);
          else
            arguments[0][key] = arguments[i][key];
        }
    return arguments[0];
  }
};

module.exports = common;