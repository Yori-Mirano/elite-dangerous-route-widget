/**
 * Watch files
 */
const fs = require('fs');
const homedir = require('os').homedir();
const config = require('./config.json');
const baseDir = config.dir.replace('%userprofile%', homedir);
const files = {
  navRoute: baseDir + '/NavRoute.json'
}


// NavRoute
let navRoute;

fs.watchFile(files.navRoute, (curr, prev) => {
  updateNavRouteFromFile();

  if (io) {
    io.emit('navroute', navRoute);
  }
});

function updateNavRouteFromFile() {
  const rawdata = fs.readFileSync(files.navRoute);
  navRoute = JSON.parse(rawdata);
  console.log('> navroute:', navRoute.Route.length, 'steps');
}

updateNavRouteFromFile();


// Current System
let currentSystem;
let lastSystem;
let isJumping = false;
const glob = require('glob')
const lineReader = require('line-reader');
const lastLogFilePath = getLastLogFilePath();
console.log('> log file: ' + lastLogFilePath);

function getLastLogFilePath() {
  return glob.sync(baseDir + '/*.log')
    .map(name => ({name, ctime: fs.statSync(name).ctime}))
    .sort((a, b) => b.ctime - a.ctime)[0].name
}

function readLastLogFile() {
  lineReader.eachLine(lastLogFilePath, function(line, last) {
    let log = JSON.parse(line);

    if (log.event === 'StartJump') {
      isJumping = true;
    }
    
    if (log.event === 'FSDJump' || log.event === 'Location') {
      isJumping = false;
      currentSystem = log.StarSystem;
    }
  
    if (last && currentSystem) {
      if (io && isJumping) {
        console.log('> jumping: ', currentSystem);
        io.emit('jumping', currentSystem);
      }

      if (lastSystem !== currentSystem) {
        console.log('> system: ', currentSystem);
        lastSystem = currentSystem
  
        if (io) {
          io.emit('system', currentSystem);
        }
      }
    }
  });
}

fs.watchFile(lastLogFilePath, (curr, prev) => {
  readLastLogFile();
});

readLastLogFile();


/**
 * Server
 */
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('> a user connected');

  if (navRoute)       { socket.emit('navroute', navRoute); }
  if (currentSystem)  { socket.emit('system', currentSystem); }
  if (isJumping)      { socket.emit('jumping', currentSystem); }

  socket.on('disconnect', () => {
    console.log('> user disconnected');
  });
});

server.listen(3000, () => {
  console.log('> listening on *:3000');
});