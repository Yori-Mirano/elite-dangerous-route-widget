const fs          = require('fs');
const YAML        = require('yaml')
const express     = require('express');
const app         = express();
const server      = require('http').createServer(app);
const { Server }  = require('socket.io');
const io          = new Server(server);

const Stats       = require('./Stats');
const Route       = require('./Route');
const GameLog     = require('./GameLog');
const GameStatus  = require('./GameStatus');
const utils       = require('./utils');


/*
 * Paths
 */
const paths = {
  configSample: __dirname + '/../config.sample.yml',
  config:       __dirname + '/../config.yml',
  stats:        __dirname + '/../stats.json',
  client:       __dirname + '/../client',
}

if (!fs.existsSync(paths.config)) {
  fs.copyFileSync(paths.configSample, paths.config, fs.constants.COPYFILE_EXCL);
}

const config      = YAML.parse(fs.readFileSync(paths.config, 'utf8'));
const homedir     = require('os').homedir();

paths.eliteLogDir = config.server.eliteLogDir.replace('%userprofile%', homedir);
paths.route       = paths.eliteLogDir + '/NavRoute.json';
paths.status      = paths.eliteLogDir + '/Status.json';


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
  stats.setRemainingJump(route.getRemainingJump(gameLog.currentSystem));
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

gameLog.onJump = nextSystemName => {
  stats.jump(route.getStepByName(nextSystemName).StarPos);
  stats.setRemainingJump(route.getRemainingJump(nextSystemName));
  stats.update();
  io.emit('jumping', nextSystemName);
}

gameLog.onLocate = systemName => {
  const system = route.getStepByName(systemName);
  if (system) {
    stats.setPosition(system.StarPos);
    stats.setRemainingJump(route.getRemainingJump(systemName));
    stats.update();
  }
  io.emit('system', systemName);
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
 * Socket
 */
io.on('connection', (socket) => {
  let clientInfo;

  socket.on('clientInfo', info => {
    clientInfo = info;
    console.log(new Date(), 'socket: user connected from ', clientInfo.origin, '(', clientInfo.platform, ')');
  });

  socket.emit('config', config.client);
  socket.emit('stats', stats.get());
  if (route.steps)            { socket.emit('route', route.steps); }
  if (gameLog.currentSystem)  { socket.emit('system', gameLog.currentSystem); }  
  if (gameStatus.status)      { socket.emit('status', gameStatus.status); }

  socket.on('config', clientConfig => {
    //console.log(new Date(), 'config: receive');
    config.client = clientConfig;
    socket.broadcast.emit('config', clientConfig);
    fs.writeFileSync(paths.config, YAML.stringify(config));
  });

  socket.on('disconnect', () => {
    console.log(new Date(), 'socket: user disconnected from ', clientInfo.origin, '(', clientInfo.platform, ')');
  });
});


/*
 * Server
 */
app.use(express.static(paths.client));

server.listen(3000, () => {
  console.log(new Date(), 'server: listening on *:3000');
  console.log('\n    Go to   http://localhost:3000   to open the widget on this device\n');
});

utils.getLocalIp().then(localIp => console.log(`    Or to   http://${localIp}:3000   to open the widget from another device on the local network\n`));