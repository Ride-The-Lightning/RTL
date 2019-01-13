var common = {};

common.lnd_server_url = '';
common.enable_logging = false;

common.convertToBTC = (num) => {
	return (num / 100000000).toFixed(6);
};

common.convertTimestampToDate = (num) => {
	return new Date(+num*1000).toUTCString();
};

module.exports = common;
