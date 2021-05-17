const fs            = require('fs');
const { spawn }     = require('child_process');
const lineReader    = require('line-reader');
const fixtureDir    = __dirname + '/fixtures';
const testDir       = __dirname + '/tmp';
const fixtureFiles  = [
  '/config.yml',
  '/Status.json',
  '/NavRoute.json',
  '/test.log'
]


function initFixtures() {
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir);
  }
  fixtureFiles.forEach(filename => fs.copyFileSync(fixtureDir + filename, testDir + filename));
  fs.writeFileSync(testDir + '/test.log', '');
}

function clearFixtures() {
  fixtureFiles.forEach(filename => fs.unlinkSync(testDir + filename));
  fs.rmdirSync(testDir);
}


initFixtures();

const childProcess = spawn(
  'node',
  ['./src/server/', './tests/tmp/config.yml'],
  {cwd: __dirname + '/..'}
);

childProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});


let lineIndex = 0;

lineReader.eachLine(fixtureDir + '/test.log', (line, last) => {
  lineIndex++;

  setTimeout(() => {
    console.log('test:',line);

    fs.appendFileSync(testDir + '/test.log', line + '\n');

    if (last) {
      setTimeout(() => {
        childProcess.kill();
        clearFixtures()
      }, 1000);
    }
  }, lineIndex * 1000);
});
