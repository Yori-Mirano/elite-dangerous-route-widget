const fs            = require('fs');
const { spawn } = require('child_process');
const lineReader    = require('line-reader');
const { kill }      = require(__dirname + '/../src/server/utils');
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

const edsmMockchildProcess = spawn(
  'npm',
  ['run', 'edsmMock'],
  { cwd: __dirname + '/..', shell: true }
);

setTimeout(() => {
  initFixtures();

  const edrwChildProcess = spawn(
    'npm',
    ['run', 'start', './tests/tmp/config.yml'],
    { cwd: __dirname + '/..', shell: true }
  );

  edrwChildProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });


  edrwChildProcess.on('uncaughtException', (data) => {
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
          kill(edrwChildProcess);
          kill(edsmMockchildProcess);
          clearFixtures()
        }, 1000);
      }
    }, lineIndex * 1000);
  });
}, 1000);
