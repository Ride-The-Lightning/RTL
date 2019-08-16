var fs = require('fs');
var crypto = require('crypto');
var common = {};

common.multi_node_setup = false;
common.rtl_conf_file_path = '';
common.node_auth_type = 'DEFAULT';
common.rtl_pass = '';
common.rtl_sso = 0;
common.port = 3000;
common.rtl_cookie_path = '';
common.logout_redirect_link = '/login';
common.cookie = '';
common.secret_key = crypto.randomBytes(64).toString('hex');
common.nodes = [];
common.selectedNode = {};

common.getSelLNDServerUrl = () => {
	return common.selectedNode.lnd_server_url;
};

common.getOptions = () => {
	return common.selectedNode.options;
};

common.setOptions = () => {
	if(undefined !== common.nodes[0].options && undefined !== common.nodes[0].options.headers) { return; }
	try {
		common.nodes.forEach(node => {
      console.log(node);
			node.options = {
				url: '',
				rejectUnauthorized: false,
				json: true,
				form: ''
      };
      if(node.ln_implementation !== 'CLightning') {
        node.options.headers = {'Grpc-Metadata-macaroon': fs.readFileSync(node.macaroon_path + '/admin.macaroon').toString('hex')};
      }
		});
		// Options cannot be set before selected node initializes. Updating selected node's options separatly
		common.selectedNode.options = {
			url: '',
			rejectUnauthorized: false,
			json: true,
			form: ''
    };
    if(common.selectedNode.ln_implementation !== 'CLightning') {
			common.selectedNode.options.headers = {'Grpc-Metadata-macaroon': fs.readFileSync(common.selectedNode.macaroon_path + '/admin.macaroon').toString('hex')};
    }
	} catch(err) {
		console.error('Common Set Options Error:' + JSON.stringify(err));
		common.nodes.forEach(node => {
			node.options = {
				url: '',
				rejectUnauthorized: false,
				json: true,
				form: ''
			};
		});
		// Options cannot be set before selected node initializes. Updating selected node's options separatly
		common.selectedNode.options = {
			url: '',
			rejectUnauthorized: false,
			json: true,
			form: ''
		};
	}
}

common.findNode = (selNodeIndex) => {
	return common.nodes.find(node => node.index == selNodeIndex);
}

common.convertToBTC = (num) => {
	return (num / 100000000).toFixed(6);
};

common.convertTimestampToDate = (num) => {
	return new Date(+num * 1000).toUTCString();
};

common.sortAscByKey = (array, key) => {
	return array.sort(function (a, b) {
		var x = a[key]; var y = b[key];
		return ((x < y) ? -1 : ((x > y) ? 1 : 0));
	});
}

common.sortDescByKey = (array, key) => {
	return array.sort(function (a, b) {
		var x = a[key]; var y = b[key];
		return ((x > y) ? -1 : ((x < y) ? 1 : 0));
	});
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