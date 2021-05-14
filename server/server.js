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

gameLog.onJump = nextSystem => {
  stats.jump(route.getStepByName(nextSystem).StarPos);
  stats.setRemainingJump(route.getRemainingJump(nextSystem));
  stats.update();
  io.emit('jumping', nextSystem);
}

gameLog.onLocate = system => {
  stats.setPosition(route.getStepByName(system).StarPos);
  stats.setRemainingJump(route.getRemainingJump(system));
  stats.update();
  io.emit('system', system);
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
  console.log(new Date(), 'socket: a user connected');

  socket.emit('config', config.client);
  socket.emit('stats', stats.get());
  if (route.steps)            { socket.emit('route', route.steps); }
  if (gameLog.currentSystem)  { socket.emit('system', gameLog.currentSystem); }  
  if (gameStatus.status)      { socket.emit('status', gameStatus.status); }

  socket.on('config', clientConfig => {
    console.log(new Date(), 'config: receive');
    config.client = clientConfig;
    socket.broadcast.emit('config', clientConfig);
    fs.writeFileSync(paths.config, YAML.stringify(config));
  });

  socket.on('disconnect', () => {
    console.log(new Date(), 'socket: user disconnected');
  });
});


/*
 * Server
 */
app.use(express.static(paths.client));

server.listen(3000, () => {
  console.log(new Date(), 'server: listening on *:3000');
  console.log('\n    Go to   http://localhost:3000   to open the widget\n');
});