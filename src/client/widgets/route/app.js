import { createElement }  from './modules/utils.js';
import handles from './modules/handles.js';
import Info    from './modules/Info.js';
import Route   from './modules/Route.js';
import Gui     from './modules/Gui.js';

const socket  = io();
const route   = new Route();
const gui     = new Gui();
const info    = new Info(createElement());
window.route  = route;
window.gui    = gui;

window.addEventListener('resize', () => route.centerView() );

[route.el, info.el].forEach(el => el.classList.add('gui'));



/*
 * Route
 */
route.onArrival = systemName => {
  // TODO: display the arrival system name instead of the route
}


/*
 * Socket
 */
socket.on('connect', () => {
  socket.emit('clientInfo', {
    origin: window.location.origin,
    platform: navigator.platform
  });
});

handles.unlock();
socket.on('unlock', () => {
  handles.unlock();
});

socket.on('lock', () => {
  handles.lock();
});

socket.on('config', config => {
  //console.log('config: receive');
  gui.setState(config);

  if (typeof config.locked !== 'undefined') {
    if (config.locked) {
      handles.lock();
    } else {
      handles.unlock();
    }
  }

  route.centerView(550);
});

socket.on('stats', stats => {
  //console.log('stats:', stats);
  info.setState(stats);
});

socket.on('route', steps => {
  //console.log('route:', steps);
  route.setSteps(steps);
  gui.resetAutohideTimeout();
});

socket.on('locate', systemName => {
  //console.log('system:', systemName);
  route.setCurrentSystem(systemName);
  gui.resetAutohideTimeout();
});

socket.on('jumping', systemName => {
  //console.log('jumping:', systemName);
  route.jump(systemName);
  gui.clearAutohideTimeout();
});

socket.on('expedition:waypoints', waypoints => {
  console.log('expedition:waypoints', waypoints);
});

socket.on('expedition:progression', progression => {
  console.log('expedition:progression', progression);
});

socket.on('status', status => {
  //console.log('status:', status);
  const inGameMenuFocus = typeof status.GuiFocus === 'undefined' || status.GuiFocus !== 0;
  document.documentElement.classList.toggle('in-game-menu-focus', gui.config.autohide.onInGameMenu && inGameMenuFocus);
});
