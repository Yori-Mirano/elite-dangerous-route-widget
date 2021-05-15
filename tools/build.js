const https     = require('https');
const fs        = require('fs');
const exec      = require('child_process').exec;
const fse       = require('fs-extra')
const version   = require('../package.json').version;
const buildName = `edrw-v${version}-win-x64`;
const sourceDir = __dirname + '/..';
const dest      = __dirname + `/../dist/${buildName}`;

const sources = [
  '/server',
  '/client',
  '/docs',
  '/config.sample.yml',
  '/README.md',
  '/LICENSE.txt',
  '/package.json',
  '/package-lock.json'
]

function download(url, dest) {
  https.get(url, response => response.pipe(fs.createWriteStream(dest)));
};

fse.emptyDirSync(dest);
sources.forEach(source => fse.copySync(sourceDir + source, dest + source));
fse.ensureDirSync(`${dest}/bin`);
download('https://nodejs.org/dist/latest-v12.x/win-x64/node.exe', `${dest}/bin/node.exe`);
fs.writeFileSync(`${dest}/edrw.bat`, '.\\bin\\node.exe .\\server\\server.js');
child = exec('npm ci', {cwd: dest});
