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


// Helpers
function getDistance(positionA, positionB) {
  return Math.sqrt(
    Math.pow(positionA[0] - positionB[0], 2)
    + Math.pow(positionA[1] - positionB[1], 2)
    + Math.pow(positionA[2] - positionB[2], 2)
  );
}

function getRemainingJump(route, currentSystemName) {
  let remainingJump = 0;

  route.forEach((system, index) => {
    if (currentSystemName === system.StarSystem) {
      remainingJump = route.length -1 - index;
    }
  });

  return remainingJump;
}


// Stats
class Stats {
  filename;
  historyLimit;
  durationLimit
  shipMaxJumpRange;
  remainingJumps;
  lastJumpDatetimeInMilliseconds;
  _remainingMinutes;
  _position;
  _shipId;

  onUpdate

  stats = {};

  constructor(filename, historyLimit = 20, durationLimit = 99) {
    this.filename = filename;
    this.historyLimit = historyLimit;
    this.durationLimit = durationLimit;

    if (fs.existsSync(this.filename)) {
      this.stats = JSON.parse(fs.readFileSync(filename));
    }
  }

  update() {
    fs.writeFileSync(this.filename, JSON.stringify(this.stats, null, 2));

    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.get());
    }
  }

  get() {
    return {
      remainingJumps:     this.remainingJumps,
      remainingLightYear: this.getRemainingLightYear(),
      remainingMinutes:   this.getRemainingMinutes(),
      lightYearPerJump:   this.getLightYearPerJump(),
      lightYearPerHour:   this.getLightYearPerHour(),
      jumpsPerHour:       this.getJumpsPerHour(),
      secondsPerJump:     this.getSecondsPerJump(),
    }
  }

  changeShip(shipId) {
    stats.endOfRoute();
    this._shipId = shipId;

    if (!this.stats[this._shipId]) {
      this.initStatsForShip(this._shipId);
    }
  }

  initStatsForShip(shipId) {
    this.stats[shipId] = {
      durationInSeconds: [],
      distanceInLightYears: []
    }
  }

  setRemainingJump(remainingJump) {
    this.remainingJumps = remainingJump;
  }

  jump(position) {
    this._updateMillisecondsPerJumpStat();
    this._updateLightYearPerJumpStat(position);
  }

  setDestinationPosition(position) {
    stats.endOfRoute();
    this._destinationPosition = position;
  }

  endOfRoute() {
    this.lastJumpDatetimeInMilliseconds = null;
    //this._position = null;
  }


  setPosition(position) {
    this._position = position;
  }

  getRemainingLightYear() {
    let distance;
    
    if (this._position && this._destinationPosition) {
      distance = getDistance(this._position, this._destinationPosition);
    }
    
    return Math.round(distance);
  }

  getLightYearPerHour() {
    return Math.round(this.getLightYearPerJump() * this.getJumpsPerHour());
  }

  _updateMillisecondsPerJumpStat() { 
    const now = Date.now();

    if (this.lastJumpDatetimeInMilliseconds && this.stats[this._shipId]) {
      const stats = this.stats[this._shipId].durationInSeconds;
      const jumpDurationInMilliseconds = now - this.lastJumpDatetimeInMilliseconds;
      stats.push(Math.min(this.durationLimit, jumpDurationInMilliseconds / 1000));
      this.shiftHistory(stats);
    }

    this.lastJumpDatetimeInMilliseconds = now;
  }

  _updateLightYearPerJumpStat(position) {
    if (this.remainingJumps > 1 && this._position && this.stats[this._shipId]) {
      const stats = this.stats[this._shipId].distanceInLightYears;
      const jumpDistance = Math.round( getDistance(this._position, position) * 10 ) / 10;
      stats.push(jumpDistance);
      this.shiftHistory(stats);
    }

    this.setPosition(position);
  }

  shiftHistory(stats) {
    const overHistoryLimit = stats.length - this.historyLimit;

    if (overHistoryLimit > 0) {
      stats.splice(0, overHistoryLimit);
    }
  }

  getJumpRangeFromStats() {
    if (this.stats[this._shipId]
      && this.stats[this._shipId].distanceInLightYears
      && this.stats[this._shipId].distanceInLightYears.length) {

      const distanceStats = this.stats[this._shipId].distanceInLightYears;
      const distance      = distanceStats.reduce((distance, total) => total + distance);
      const count         = distanceStats.length;

      return distance / count;
    }

    return null;
  }

  getJumpRangeFromRoute() {
    return this.remainingJumps
         ? this.getRemainingLightYear() / this.remainingJumps
         : null;
  }

  getLightYearPerJump() {
    const jumpRange =  this.getJumpRangeFromStats()
                    || this.getJumpRangeFromRoute()
                    || this.shipMaxJumpRange;

    return Math.round(jumpRange * 10) / 10;
  }

  getSecondsPerJump() {
    if (this.stats[this._shipId]
      && this.stats[this._shipId].durationInSeconds
      && this.stats[this._shipId].durationInSeconds.length) {

      const durationStats = this.stats[this._shipId].durationInSeconds;
      const duration      = durationStats.reduce((duration, total) => total + duration);
      const count         = durationStats.length;

      return duration / count;
    }

    return 60;
  }

  getRemainingMinutes() {
    return Math.round(this.getSecondsPerJump() * this.remainingJumps / 60)
        || 0;
  }

  getJumpsPerHour() {
    return Math.round(60 * 60 / this.getSecondsPerJump());
  }
}


// Route
class Route {
  filename;
  route;
  onUpdate;

  constructor(filename) {
    this.filename = filename;
  }
  
  watchFile() {
    this.updateFromFile();
  
    let watchTimeout; 
  
    fs.watch(this.filename, () => {
      if (watchTimeout) { clearTimeout(watchTimeout); } // prevent duplicated watch notifications
      
      watchTimeout = setTimeout(() => {
        console.log(new Date(), 'watchRoute: change detected');
        this.updateFromFile();
      }, 100);
    });
  }

  updateFromFile() {
    const rawdata = fs.readFileSync(this.filename);
    this.route = JSON.parse(rawdata).Route;
    console.log(new Date(), 'route:', this.route.length -1, 'steps');
  
    this.update();
  }
  
  update() {
    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.route);
    }
  }

  getByName(name) {
    return this.route.find(step => step.StarSystem === name);
  }
}

const route = new Route(files.route);


// Current System
const glob = require('glob')
const lineReader = require('line-reader');
const stats = new Stats('./stats.json', config.server.stats.historyLimit, config.server.stats.durationLimit);
let currentShip;
let lastShipId;
let currentSystem;
let lastJumpSystem;
let lastSystem;
let isJumping = false;
let lastLogFilePath;
let prevLogFilePath;
let dirWatcher;

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
      //console.log(new Date(), 'watchLogFromMostRecentFile: change detected');
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
      case 'Loadout':
        currentShip = {
          shipId: log.ShipID,
          ship: log.Ship,
          shipName: log.ShipName,
          shipIdent: log.ShipIdent,
          maxJumpRange: log.MaxJumpRange
        };
        break;

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
      if (lastShipId !== currentShip.shipId) {
        console.log(new Date(), 'ship: [ id:', currentShip.shipId, '| type:', currentShip.ship, '| name:', currentShip.shipName, '| ident:', currentShip.shipIdent, ']');
        lastShipId = currentShip.shipId;

        stats.changeShip(currentShip.shipId);
        stats.shipMaxJumpRange = currentShip.maxJumpRange;
        stats.update();
      }
      
      if (isJumping) {
        if (nextSystem && nextSystem !== lastJumpSystem) {
          console.log(new Date(), 'jumping: ', nextSystem);
          lastJumpSystem = nextSystem;

          const remainingJump = getRemainingJump(route.route, nextSystem);
          stats.jump(route.getByName(nextSystem).StarPos);
          stats.setRemainingJump(remainingJump);
          if (remainingJump === 0) {
            stats.endOfRoute();
          }
          stats.update();

          if (io) { io.emit('jumping', nextSystem); }
        }

      } else if (currentSystem && currentSystem !== lastSystem) {
        console.log(new Date(), 'system:', currentSystem);
        lastSystem = currentSystem;

        stats.setPosition(route.getByName(currentSystem).StarPos);
        stats.setRemainingJump(getRemainingJump(route.route, currentSystem));
        stats.update();
        
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

stats.onUpdate = stats => io.emit('stats', stats);

route.onUpdate = route => {
  stats.setDestinationPosition(route[route.length-1].StarPos);
  stats.setRemainingJump(getRemainingJump(route, currentSystem));
  stats.update();
  io.emit('route', route);
};

route.watchFile();

io.on('connection', (socket) => {
  console.log(new Date(), 'a user connected');

  socket.emit('config', config.client);
  socket.emit('stats', stats.get());

  if (route.route)    { socket.emit('route', route.route); }
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
  console.log('\n    Go to   http://localhost:3000   to open the widget\n');
});