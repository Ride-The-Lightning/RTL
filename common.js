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

common.getSelSwapServerUrl = () => {
  return common.selectedNode.swap_server_url;
};

common.getSelLNServerUrl = () => {
  return common.selectedNode.ln_server_url;
};

common.getOptions = () => {
  common.selectedNode.options.method = 'GET';
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
    form: ''
  };
  try {
    if (common.selectedNode && common.selectedNode.ln_implementation && common.selectedNode.ln_implementation.toUpperCase() === 'CLT') {
      common.selectedNode.options.headers = { 'macaroon': Buffer.from(fs.readFileSync(path.join(common.selectedNode.macaroon_path, 'access.macaroon'))).toString("base64") };
    } else {
      common.selectedNode.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(path.join(common.selectedNode.macaroon_path, 'admin.macaroon')).toString('hex') };
    }
    return { status: 200, message: 'Updated Successfully!' };
  } catch(err) {
    common.selectedNode.options = {
      url: '',
      rejectUnauthorized: false,
      json: true,
      form: ''
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
        form: ''
      };
      try {
        if (node.ln_implementation && node.ln_implementation.toUpperCase() === 'CLT') {
          node.options.headers = { 'macaroon': Buffer.from(fs.readFileSync(path.join(node.macaroon_path, 'access.macaroon'))).toString("base64") };
        } else {
          node.options.headers = { 'Grpc-Metadata-macaroon': fs.readFileSync(path.join(node.macaroon_path, 'admin.macaroon')).toString('hex') };
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

module.exports = common;