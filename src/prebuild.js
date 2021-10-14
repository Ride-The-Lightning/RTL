import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as os from 'os';

const directoryName = dirname(fileURLToPath(import.meta.url));
const packageJSON = JSON.parse(fs.readFileSync(join(directoryName, '../', 'package.json'), 'utf-8'));
const appVersion = packageJSON.version;
const versionFilePath = join(directoryName + '/environments/version.ts');
const versionStr = 'export const VERSION = \'' + appVersion + '\';' + os.EOL;

fs.writeFileSync(versionFilePath, versionStr, 'utf-8');
console.log('\n\n=============================================');
console.log('Updating application version to ' + appVersion + '.');
console.log('=============================================');

try {
	const commonFilePath = join(directoryName, "..", "server", "utils", "common.ts");
	const commonFileData = fs.readFileSync(commonFilePath, 'utf-8');
	const commonFileLined = commonFileData.split(os.EOL);
	const foundDataLine = commonFileLined.find(lineItem => lineItem.includes('public read_dummy_data =') || lineItem.includes('public read_dummy_data=') || lineItem.includes('private read_dummy_data =') || lineItem.includes('private read_dummy_data='));
	const foundDataLineIndex = commonFileLined.findIndex(lineItem => lineItem.includes('public read_dummy_data =') || lineItem.includes('public read_dummy_data=') || lineItem.includes('private read_dummy_data =') || lineItem.includes('private read_dummy_data='));
	if (foundDataLine.includes('true')) {
		commonFileLined[foundDataLineIndex] = '  public read_dummy_data = false;';
		fs.writeFileSync(commonFilePath, commonFileLined.join(os.EOL), 'utf-8');
		console.log('\n==============================================================================================');
		console.log('WARNING: COMMON.TS HAS BEEN REWRITTEN TO UNSET THE DUMMY DATA FLAG. PLEASE RE-CHECK THE FILE.');
		console.log('==============================================================================================\n');
	}
} catch (err) {
	console.error(err);
}