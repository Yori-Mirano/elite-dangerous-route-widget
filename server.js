/**
 * Watch files
 */
const fs = require('fs');
const homedir = require('os').homedir();
const YAML = require('yaml')

if (!fs.existsSync('./config.yml')) {
  fs.copyFileSync('./config.sample.yml', './config.yml', fs.constants.COPYFILE_EXCL);
}

const config = YAML.parse(fs.readFileSync('./config.yml', 'utf8'));
const baseDir = config.server.eliteLogDir.replace('%userprofile%', homedir);
const files = {
  route: baseDir + '/NavRoute.json'
}


// Route
let route;

function updateRouteFromFile() {
  const rawdata = fs.readFileSync(files.route);
  route = JSON.parse(rawdata).Route;
  console.log(new Date(), 'route:', route.length, 'steps');
}

function watchRoute() {
  updateRouteFromFile();

  let watchTimeout; 

  fs.watch(files.route, () => {
    if (watchTimeout) { clearTimeout(watchTimeout); } // prevent duplicated watch notifications
    
    watchTimeout = setTimeout(() => {
      console.log(new Date(), 'watchRoute: change detected');
      updateRouteFromFile();
      if (io) { io.emit('route', route); }
    }, 100);
  });
}

watchRoute();


// Current System
const glob = require('glob')
const lineReader = require('line-reader');
let currentSystem;
let lastJumpSystem;
let lastSystem;
let isJumping = false;
let lastLogFilePath;
let prevLogFilePath;
let dirWatcher;
let fileWatcher;

function watchLog() {
  let watchTimeout;

  dirWatcher = fs.watch(baseDir, () => {
    if (watchTimeout) { clearTimeout(watchTimeout); } // prevent duplicated watch notifications
    
    watchTimeout = setTimeout(() => {
      console.log(new Date(), 'watchLog: change detected');
      watchLogFromMostRecentFile();
    }, 100);
  });

  watchLogFromMostRecentFile(); 
}

function watchLogFromMostRecentFile() {
  lastLogFilePath = glob.sync(baseDir + '/*.log')
    .map(name => ({name, ctime: fs.statSync(name).ctime}))
    .sort((a, b) => b.ctime - a.ctime)[0].name;
  
  if (lastLogFilePath !== prevLogFilePath) {    
    console.log(new Date(), 'log file: ' + lastLogFilePath);
    prevLogFilePath = lastLogFilePath;
    
    if (dirWatcher) { dirWatcher.close(); }
    
    fs.watchFile(lastLogFilePath, { interval: 1000 }, () => {
      console.log(new Date(), 'watchLogFromMostRecentFile: change detected');
      dispatchLogEvents();
    });

    dispatchLogEvents();
  }
}

function dispatchLogEvents() {
  lineReader.eachLine(lastLogFilePath, function(line, last) {
    const log = JSON.parse(line);
    let nextSystem;

    switch (log.event) {
      case 'StartJump':
        if (log.JumpType === "Hyperspace") {
          isJumping = true;
          nextSystem = log.StarSystem;
        }
        break;

      case 'Location':
      case 'FSDJump':
        isJumping = false;
        currentSystem = log.StarSystem;
        break;

      case 'Shutdown':
        fs.unwatchFile(lastLogFilePath);
        watchLog();
        break;

      default:
        // Do nothing
    }
  
    if (last) {
      if (isJumping) {
        if (nextSystem && nextSystem !== lastJumpSystem) {
          console.log(new Date(), 'jumping: ', nextSystem);
          lastJumpSystem = nextSystem;
          if (io) { io.emit('jumping', nextSystem); }
        }

      } else if (currentSystem && currentSystem !== lastSystem) {
        console.log(new Date(), 'system: ', currentSystem);
        lastSystem = currentSystem;
        if (io) { io.emit('system', currentSystem); }
      }
    }
  });
}

watchLog();


/**
 * Server
 */
const app = require('express')();
const server = require('http').createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/client.html');
});

io.on('connection', (socket) => {
  console.log(new Date(), 'a user connected');

  socket.emit('config', config.client);
  
  if (route)          { socket.emit('route', route); }
  if (currentSystem)  { socket.emit('system', currentSystem); }
  if (isJumping)      { socket.emit('jumping', currentSystem); }
  

  socket.on('config', clientConfig => {
    console.log(new Date(), 'config: receive');
    config.client = clientConfig;
    socket.broadcast.emit('config', clientConfig);

    fs.writeFileSync('./config.yml', YAML.stringify(config));
  });

  socket.on('disconnect', () => {
    console.log(new Date(), 'user disconnected');
  });
});

server.listen(3000, () => {
  console.log(new Date(), 'listening on *:3000');
});