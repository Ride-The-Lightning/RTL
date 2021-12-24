var path = require('path');
var fs = require('fs');
var os = require('os');

module.exports = function () {
	var packageJSON = JSON.parse(fs.readFileSync(path.join(__dirname, '../', 'package.json'), 'utf-8'));
	var appVersion = packageJSON.version;

	try {
		console.log('\n\n=============================================');
		console.log('Updating application version to ' + appVersion + '.');
		console.log('=============================================');
		var versionFilePath = path.join(__dirname + '/environments/environment.ts');
		var versionProdFilePath = path.join(__dirname + '/environments/environment.prod.ts');
		var versionStr = os.EOL + 'export const VERSION = \'' + appVersion + '\';' + os.EOL;
		fs.appendFileSync(versionFilePath, versionStr);
		fs.appendFileSync(versionProdFilePath, versionStr);
	} catch (err) {
		console.error(err);
	}

	try {
		var commonFilePath = path.join(__dirname, "..", "server", "utils", "common.ts");
		var commonFileData = fs.readFileSync(commonFilePath, 'utf-8');
		var commonFileLined = commonFileData.split(os.EOL);
		var foundDataLine = commonFileLined.find(function(lineItem) { return lineItem.includes('public read_dummy_data =') || lineItem.includes('public read_dummy_data=') || lineItem.includes('private read_dummy_data =') || lineItem.includes('private read_dummy_data=')});
		var foundDataLineIndex = commonFileLined.findIndex(function(lineItem) { return lineItem.includes('public read_dummy_data =') || lineItem.includes('public read_dummy_data=') || lineItem.includes('private read_dummy_data =') || lineItem.includes('private read_dummy_data=')});
		if (foundDataLine.includes('true')) {
			commonFileLined[foundDataLineIndex] = '  public read_dummy_data = false;';
			fs.writeFileSync(commonFilePath, commonFileLined.path.join(os.EOL), 'utf-8');
			console.log('\n==============================================================================================');
			console.log('WARNING: COMMON.TS HAS BEEN REWRITTEN TO UNSET THE DUMMY DATA FLAG. PLEASE RE-CHECK THE FILE.');
			console.log('==============================================================================================\n');
		}
	} catch (err) {
		console.error(err);
	}
};
