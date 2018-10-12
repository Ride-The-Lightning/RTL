var common = {};

common.lnd_server_url = 'https://localhost:8080/v1';
common.lnd_dir = '';

common.convertToBTC = (num) => {
	return (num / 100000000).toFixed(6);
};

common.convertTimestampToDate = (num) => {
	return new Date(+num*1000).toLocaleString();
};

module.exports = common;
