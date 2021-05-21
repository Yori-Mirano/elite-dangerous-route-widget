const http  = require ('http');
const https = require ('https');
const os    = require('os');
const { execSync } = require('child_process');

exports.getDistance = (positionA, positionB) => {
  return Math.sqrt(
    Math.pow(positionA[0] - positionB[0], 2)
    + Math.pow(positionA[1] - positionB[1], 2)
    + Math.pow(positionA[2] - positionB[2], 2)
  );
}


exports.getLocalIp = () => {
  return new Promise((resolve, reject) => {
    require('dns').lookup(require('os').hostname(), function (err, add, fam) {
      resolve(add);
    });
  });
}


exports.fetch = (url) => {
  return new Promise((resolve, reject) => {
    const protocol = /^https/.test(url) ? https : http;
    const request = protocol.get(url, res => {
      let data = '';

      res.on('data', function (chunk) {
        data += chunk;
      });

      res.on('end', function () {
        resolve({
          headers:  res.headers,
          data:     data
        });
      });
    });

    request.on('error', function (e) {
      reject(e.message);
    });

    request.end();
  });
}

exports.kill = (process) => {
  if (os.platform() === 'win32') { // process.platform was undefined for me, but this works
    execSync(`taskkill /F /T /PID ${process.pid}`); // windows specific
  } else {
    process.kill();
  }
}

exports.trackWindowState = (windowRef, callback) => {
  ['resized', 'moved'].forEach(event => {
    windowRef.on(event, () => {
      callback(windowRef.getBounds());
    });
  });
}
