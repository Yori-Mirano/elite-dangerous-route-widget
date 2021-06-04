const fs          = require('fs');
const YAML        = require('yaml')
var path          = require("path")
const express     = require('express');
const expressApp  = express();
const server      = require('http').createServer(expressApp);
const { Server }  = require('socket.io');
const io          = new Server(server);
const { app }     = require('electron');
const open        = require('open');

const Stats       = require('./Stats');
const Route       = require('./Route');
const GameLog     = require('./GameLog');
const GameStatus  = require('./GameStatus');
const EdsmExpedition = require('./EdsmExpedition');
const utils       = require('./utils');
const WindowManager = require('./WindowManager');

const customConfigPath = process.argv[2];

let edsmExpedition;

/*
 * Paths
 */
const paths = {
  configSample: `${__dirname}/../config.sample.yml`,
  config:       customConfigPath
                ? customConfigPath
                : `${app.getPath("userData")}/config.yml`,
  stats:        `${app.getPath("userData")}/stats.json`,
  client:       `${__dirname}/../client`,
}

if (!fs.existsSync(paths.config)) {
  fs.copyFileSync(paths.configSample, paths.config, fs.constants.COPYFILE_EXCL);
}

let config        = YAML.parse(fs.readFileSync(paths.config, 'utf8'));
const homedir     = require('os').homedir();

paths.eliteLogDir = config.server.eliteLogDir.replace('%userprofile%', homedir);
paths.route       = paths.eliteLogDir + '/NavRoute.json';
paths.status      = paths.eliteLogDir + '/Status.json';

function saveConfig() {
  fs.writeFileSync(paths.config, YAML.stringify(config));
}

/*
 * Stats
 */
const stats    = new Stats(paths.stats, config.server.stats.historyLimit, config.server.stats.durationLimit);
stats.onUpdate = stats => io.emit('stats', stats);


/*
 * Route
 */
const route   = new Route(paths.route);
const gameLog = new GameLog(paths.eliteLogDir);

route.onChange = steps => {
  stats.setDestinationPosition(steps[steps.length-1].StarPos);
  if (gameLog.currentSystem && gameLog.currentSystem.name) {
    stats.setRemainingJump(route.getRemainingJump(gameLog.currentSystem.name));
  }
  stats.update();
  io.emit('route', steps);
};

route.watchFile();


/*
 * GameLog
 */

gameLog.onShipChange = ship => {
  stats.changeShip(ship.shipId);
  stats.shipMaxJumpRange = ship.maxJumpRange;
  stats.update();
}

gameLog.onJump = nextSystem => {
  // console.log('jumping:', nextSystem);
  const step = route.getStepByName(nextSystem.name);
  if (step) {
    stats.jump(step.StarPos);
    stats.setRemainingJump(route.getRemainingJump(nextSystem.name));
    stats.update();
  }
  io.emit('jumping', nextSystem.name);
}

gameLog.onLocate = system => {
  // console.log('locate:', system);
  const step = route.getStepByName(system.name);
  if (step) {
    stats.setPosition(step.StarPos);
    stats.setRemainingJump(route.getRemainingJump(system.name));
    stats.update();
  }
  io.emit('locate', system.name);

  if (edsmExpedition && edsmExpedition.isFetched) {
    io.emit('expedition:progression', edsmExpedition.getProgression(system.position));
  }
}

gameLog.watchLog();


/*
 * GameStatus
 */
const gameStatus = new GameStatus(paths.status);

gameStatus.onChange = gameStatus => {
  io.emit('status', gameStatus);
};

gameStatus.watchFile();



/*
 * EdsmExpedition
 */
if (config.server.edsmExpeditionUrl) {
  edsmExpedition = new EdsmExpedition(config.server.edsmExpeditionUrl);
  edsmExpedition.fetchWaypoints().then(waypoints => {
    io.emit('expedition:waypoints', waypoints);

    if (gameLog.currentSystem) {
      io.emit('expedition:progression', edsmExpedition.getProgression(gameLog.currentSystem.position));
    }
  });
}



/*
 * Socket
 */
let windowManager;


io.on('connection', (socket) => {
  let clientInfo;

  socket.on('clientInfo', info => {
    clientInfo = info;
    console.log(new Date(), 'socket: user connected from ', clientInfo.origin, '(', clientInfo.platform, ')');
  });

  socket.emit('config', config.client);
  socket.emit('stats', stats.get());

  if (typeof config.client.locked !== 'undefined') { socket.emit(config.client.locked ? 'lock' : 'unlock'); }

  if (route.steps)                { socket.emit('route', route.steps); }
  if (gameStatus.status)          { socket.emit('status', gameStatus.status); }
  if (gameLog.isJumping) {
    if (gameLog.lastJumpSystem)   { socket.emit('jumping', gameLog.lastJumpSystem.name); }
  } else {
    if (gameLog.currentSystem)    { socket.emit('locate', gameLog.currentSystem.name); }
  }

  if (edsmExpedition && edsmExpedition.waypoints) {
    socket.emit('expedition:waypoints', edsmExpedition.waypoints);

    if (gameLog.currentSystem) {
      io.emit('expedition:progression', edsmExpedition.getProgression(gameLog.currentSystem.position));
    }
  }

  socket.on('config', clientConfig => {
    console.log(new Date(), 'config: receive');
    socket.broadcast.emit('config', clientConfig);
    config.client = clientConfig;
    saveConfig();
  });

  socket.on('disconnect', () => {
    if (clientInfo) {
      console.log(new Date(), 'socket: user disconnected from ', clientInfo.origin, '(', clientInfo.platform, ')');
    } else {
      console.log(new Date(), 'socket: user disconnected');
    }
  });

  socket.on('lock', () => {
    config.client.locked = true;
    saveConfig();
    windowManager.windows.route.setIgnoreMouseEvents(true);
    socket.broadcast.emit('lock');
  });

  socket.on('unlock', () => {
    config.client.locked = false;
    saveConfig();
    windowManager.windows.route.setIgnoreMouseEvents(false);
    socket.broadcast.emit('unlock');
  });
});


/*
 * Server
 */
expressApp.use(express.static(paths.client));

server.listen(3000, () => {
  console.log(new Date(), 'server: listening on *:3000');
  console.log(  '\n    Go to   http://localhost:3000      to open the widget on this device,');

  utils.getLocalIp().then(localIp => {
    console.log(  `    or to   http://${localIp}:3000   to open the widget from another device on the local network\n`)

    if (app) {
      if (!config.windows) {
        config.windows = {};
      }
      windowManager = new WindowManager(config.windows, config.client.locked);
      windowManager.createMain('http://localhost:3000/controls')
                   .then(windowManager.createWidget('http://localhost:3000/widgets/route'));

      windowManager.onStateChange = state => {
        config.windows = state;
        saveConfig();
      };
    } else {
      open('http://localhost:3000/widgets/route');
    }
  });
});
