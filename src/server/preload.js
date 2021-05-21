const { contextBridge, ipcRenderer, remote } = require('electron');

let currWindow = remote.BrowserWindow.getFocusedWindow();

window.closeCurrentWindow = function(){
  currWindow.close();
}

console.log('PRELOAD', window.closeCurrentWindow);

contextBridge.exposeInMainWorld(
  'plop',
  {
    closeCurrentWindow: () => currWindow.close()
  }
)

contextBridge.exposeInMainWorld(
  'ipcRenderer',
  {
    send: () => ipcRenderer.send()
  }
)

//process.once('loaded', () => {
//  window.ipcRenderer = electron.ipcRenderer;
//});
