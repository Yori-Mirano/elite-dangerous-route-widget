const https           = require('https');
const fs              = require('fs');
const fse             = require('fs-extra')
const { execSync }    = require('child_process');
const md              = require('markdown-it')({ html: true, linkify: true });
const {name, version} = require('../package.json');
const buildName       = `${name}-v${version}-win-x64`;
const sourceDir       = __dirname + '/..';
const destDir         = __dirname + `/../dist/${buildName}`;

const sources = [
  '/src',
  '/docs',
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
execSync('npm ci', {cwd: destDir});
fse.removeSync(`${destDir}/package-lock.json`);

const readmeHtmlLayout = fs.readFileSync(`${sourceDir}/tools/doc-layout.html`, 'utf8');
const readmeHtmlBody = md.render(fs.readFileSync(`${sourceDir}/README.md`, 'utf8'));
const readmeHtml = readmeHtmlLayout.replace('<main></main>', `<main>${readmeHtmlBody}</main>`);
fs.writeFileSync(`${destDir}/README.html`, readmeHtml);
