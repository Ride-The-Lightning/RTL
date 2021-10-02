const path = require('path');
const fs = require('fs');
const os = require('os'); 

const appVersion = require('../package.json').version;
const versionFilePath = path.join(__dirname + '/environments/version.ts');
const versionStr = 'export const VERSION = \'' + appVersion + '\';' + os.EOL;

fs.writeFileSync(versionFilePath, versionStr, 'utf-8');
console.log('\n\n=============================================');
console.log('Updating application version to ' + appVersion + '.');
console.log('=============================================');

const commonFilePath = path.join(__dirname, "..", "backend", "utils", "common.js");
const commonFileData = fs.readFileSync(commonFilePath, 'utf-8');
const commonFileLined = commonFileData.split(os.EOL);
const foundDataLine = commonFileLined.find(lineItem => lineItem.includes('common.read_dummy_data =') || lineItem.includes('common.read_dummy_data='));
const foundDataLineIndex = commonFileLined.findIndex(lineItem => lineItem.includes('common.read_dummy_data =') || lineItem.includes('common.read_dummy_data='));

if (foundDataLine.includes('true')) {
	commonFileLined[foundDataLineIndex] = 'common.read_dummy_data = false;';
	fs.writeFileSync(commonFilePath, commonFileLined.join(os.EOL), 'utf-8');
	console.log('\n==============================================================================================');
	console.log('WARNING: COMMON.JS HAS BEEN REWRITTEN TO UNSET THE DUMMY DATA FLAG. PLEASE RE-CHECK THE FILE.');
	console.log('==============================================================================================\n');
}
