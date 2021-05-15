const https     = require('https');
const fs              = require('fs');
const exec            = require('child_process').exec;
const fse             = require('fs-extra')
const {name, version} = require('../package.json');
const buildName       = `${name}-v${version}-win-x64`;
const sourceDir       = __dirname + '/..';
const destDir         = __dirname + `/../dist/${buildName}`;

const sources = [
  '/src',
  '/docs',
  '/README.md',
  '/LICENSE.txt',
  '/package.json',
  '/package-lock.json'
]

function download(url, dest) {
  https.get(url, response => response.pipe(fs.createWriteStream(dest)));
};

fse.emptyDirSync(destDir);
sources.forEach(source => fse.copySync(sourceDir + source, destDir + source));
fse.ensureDirSync(`${destDir}/bin`);
download('https://nodejs.org/dist/latest-v12.x/win-x64/node.exe', `${destDir}/bin/node.exe`);
fs.writeFileSync(`${destDir}/${name}.bat`, '.\\bin\\node.exe .\\src\\server\\index.js');
child = exec('npm ci', {cwd: destDir});
