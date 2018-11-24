var common = {};

common.lnd_server_url = 'https://localhost:8080/v1';
common.lnd_dir = '';

common.convertToBTC = (num) => {
	return (num / 100000000).toFixed(6);
};

common.convertTimestampToDate = (num) => {
	return new Date(+num*1000).toUTCString();
	// datetoConvert = new Date(+num*1000);
	// // (datetoConvert.getMonth() + 1) // Because in JS, months is an array and index starts with 0 (January gives 0)
	// return (datetoConvert.getMonth() + 1) + '/' + datetoConvert.getDate() + '/' + datetoConvert.getFullYear() + ' ' +
	// datetoConvert.getHours() + ':' + datetoConvert.getMinutes() + ':' + datetoConvert.getSeconds();
};

module.exports = common;
