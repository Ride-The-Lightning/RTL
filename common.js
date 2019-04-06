var fs = require('fs');
var crypto = require('crypto');
var common = {};

common.multi_node_setup = false;
common.port = 3000;
common.rtl_conf_file_path = '';
common.lnd_server_url = '';
common.lnd_config_path = '';
common.node_auth_type = 'DEFAULT';
common.macaroon_path = '';
common.bitcoind_config_path = '';
common.rtl_pass = '';
common.enable_logging = false;
common.log_file = '';
common.rtl_sso = 0;
common.rtl_cookie_path = '';
common.logout_redirect_link = '/login';
common.cookie = '';
common.secret_key = crypto.randomBytes(64).toString('hex');
common.options = {};
common.nodes = [];

common.getOptions = (selNodeIndex) => {
	if(selNodeIndex === '') {
		return common.options;
	} else {
		return common.findNode(selNodeIndex).options;
	}
};

common.setOptions = (selNodeIndex) => {
	if(selNodeIndex === '') {
		const macaroon = fs.readFileSync(common.macaroon_path + '/admin.macaroon').toString('hex');
		common.options = {
			url: '',
			rejectUnauthorized: false,
			json: true,
			headers: {
				'Grpc-Metadata-macaroon': macaroon,
			},
			form: ''
		};
		return common.options;
	} else {
		const selNode = common.findNode(selNodeIndex);
		const macaroon = fs.readFileSync(selNode.macaroon_path + '/admin.macaroon').toString('hex');
		selNode.options = {
			url: '',
			rejectUnauthorized: false,
			json: true,
			headers: {
				'Grpc-Metadata-macaroon': macaroon,
			},
			form: ''
		};
		return selNode.options;
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