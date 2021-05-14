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


gui.onChange = config => {
  console.log('config: emit');
  socket.emit('config', config);
};


socket.on('config', config => {
  console.log('config: receive');
  gui.setState(config);
  route.centerView(550);
});

socket.on('stats', stats => {
  console.log('stats:', stats);
  info.setState(stats);
});

socket.on('route', steps => {
  console.log('route:', steps);
  route.setSteps(steps);
});

socket.on('system', systemName => {
  console.log('system:', systemName);
  route.setCurrentSystem(systemName);
});

socket.on('jumping', systemName => {
  console.log('jumping:', systemName);
  route.jump(systemName);
});