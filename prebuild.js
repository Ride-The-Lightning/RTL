const path = require('path');
const fs = require('fs');
const appVersion = require('./package.json').version;
const versionFilePath = path.join(__dirname + '/src/environments/version.ts');
const versionStr = `export const VERSION = '${appVersion}';`;
fs.writeFile(versionFilePath, versionStr, { flat: 'w' }, function (err) {
	if (err) {
		return console.error(err);
	}
	console.log(`Updating application version ${appVersion}`);
	console.log(`${'Writing version module to '}${versionFilePath}\n`);
});
