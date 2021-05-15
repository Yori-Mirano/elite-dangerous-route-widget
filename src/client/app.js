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


/*
 * GUI
 */
gui.onChange = config => {
  //console.log('config: emit');
  socket.emit('config', config);
};

gui.onShow = () => {
  [route.el, info.el].forEach(el => el.classList.remove('hidden'));
};

gui.onHide = () => {
  [route.el, info.el].forEach(el => el.classList.add('hidden'));
};


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
});

socket.on('system', systemName => {
  //console.log('system:', systemName);
  route.setCurrentSystem(systemName);
});

socket.on('jumping', systemName => {
  //console.log('jumping:', systemName);
  route.jump(systemName);
});

socket.on('status', status => {
  //console.log('status:', status);
  const inGameMenuFocus = typeof status.GuiFocus === 'undefined' || status.GuiFocus !== 0;
  gui.updateAutohide(inGameMenuFocus);
});
