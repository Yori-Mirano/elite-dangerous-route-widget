import Gui from './modules/Gui.js';
const gui     = new Gui();
window.gui    = gui;
const socket  = io();


/*
 * Lock
 */
const checkbox = document.getElementById('checkbox');
checkbox.addEventListener('change', () => socket.emit(checkbox.checked ? 'lock' : 'unlock'))

socket.on('unlock', () => {
  checkbox.checked = false;
});

socket.on('lock', () => {
  checkbox.checked = true;
});



/*
 * GUI
 */
gui.onChange = config => {
  socket.emit('config', config);
};

socket.on('config', config => {
  gui.setState(config);

  if (typeof config.locked !== 'undefined') {
    checkbox.checked = config.locked;
  }
});


window.copyToClipboard = value => {
  var tempInput = document.createElement("input");
  tempInput.value = value;
  document.body.appendChild(tempInput);
  tempInput.select();
  document.execCommand("copy");
  document.body.removeChild(tempInput);
};
