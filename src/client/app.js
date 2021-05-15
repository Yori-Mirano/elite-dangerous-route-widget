import { createElement }  from './modules/utils.js';
import Info    from './modules/Info.js';
import Gui     from './modules/Gui.js';
import Route   from './modules/Route.js';

const socket  = io();
const route   = new Route();
const info    = new Info(createElement());
const gui     = new Gui();
window.route  = route;
window.gui    = gui;

window.addEventListener('resize', () => route.centerView() );

[route.el, info.el].forEach(el => el.classList.add('gui'));

/*
 * GUI
 */
gui.onChange = config => {
  //console.log('config: emit');
  socket.emit('config', config);
};


/*
 * Route
 */
route.onArrival = systemName => {
  // TODO: display the arrival system name instead of the route
}


/*
 * Socket
 */
socket.on('connect',function(){
  socket.emit('clientInfo', {
    origin: window.location.origin,
    platform: navigator.platform
  });
});

socket.on('config', config => {
  //console.log('config: receive');
  gui.setState(config);
  route.centerView(550);
});

socket.on('stats', stats => {
  //console.log('stats:', stats);
  info.setState(stats);
});

socket.on('route', steps => {
  //console.log('route:', steps);
  route.setSteps(steps);
  gui.resetAutohideTimeout(info.secondsPerJump * 2);
});

socket.on('system', systemName => {
  //console.log('system:', systemName);
  route.setCurrentSystem(systemName);
  gui.resetAutohideTimeout(info.secondsPerJump * 2);
});

socket.on('jumping', systemName => {
  //console.log('jumping:', systemName);
  route.jump(systemName);
  document.documentElement.classList.remove('timeout');
  gui.clearAutohideTimeout();
});

socket.on('status', status => {
  //console.log('status:', status);
  const inGameMenuFocus = typeof status.GuiFocus === 'undefined' || status.GuiFocus !== 0;
  document.documentElement.classList.toggle('in-game-menu-focus', inGameMenuFocus);
});
