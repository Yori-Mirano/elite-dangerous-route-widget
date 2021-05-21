const fs              = require('fs');
const fse             = require('fs-extra');
const md              = require('markdown-it')({ html: true, linkify: true });
const {name, version} = require('../package.json');
const buildName       = `${name}-v${version}-win-x64`;
const sourceDir       = `${__dirname}/..`;
const electronBuildDir= `${__dirname}/../dist/win-unpacked`;
const destDir         = `${__dirname}/../dist/${buildName}`;

if (fs.existsSync(electronBuildDir)) {
  fse.copySync(`${sourceDir}/docs`, `${electronBuildDir}/docs`)
  const readmeHtmlLayout = fs.readFileSync(`${sourceDir}/tools/doc-layout.html`, 'utf8');
  const readmeHtmlBody = md.render(fs.readFileSync(`${sourceDir}/README.md`, 'utf8'));
  const readmeHtml = readmeHtmlLayout.replace('<main></main>', `<main>${readmeHtmlBody}</main>`);
  fs.writeFileSync(`${electronBuildDir}/README.html`, readmeHtml);
  fse.moveSync(electronBuildDir, destDir, { overwrite: true });
}
