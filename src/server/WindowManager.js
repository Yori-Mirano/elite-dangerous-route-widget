const { app, BrowserWindow, screen } = require('electron');
const { trackWindowState } = require('./utils');

module.exports = class WindowManager {
  state = {};
  windows = {};
  onStateChange;

  constructor(state) {
    this.state = state;
  }

  createMain(url) {
    return new Promise(resolve => {
      this.windows.main = new BrowserWindow({
        width: 300,
        height: 200,
        resizable: false,
        maximizable: false,
        show: false
      });
      this.windows.main.removeMenu();
      this.windows.main.loadURL(url);

      this.windows.main.on('closed', () => {
        app.quit();
        process.exit();
      });

      this.windows.main.once('ready-to-show', () => {
        this.windows.main.show()
        resolve();
      });
    });
  }

  createWidget(url) {
    const displays = screen.getAllDisplays();
    const width = displays[0].bounds.width;

    if (!this.state.route) {
      this.state.route = {
        x: width/2 - (width - 100)/2,
        y: 50,
        width: width - 100,
        height: 170
      };
    }

    this.windows.route = new BrowserWindow({
      parent: this.windows.main,
      x: this.state.route.x,
      y: this.state.route.y,
      width: this.state.route.width,
      height: this.state.route.height,
      frame: false,
      transparent: true,
      alwaysOnTop: true,
      minimizable: false,
      maximizable: false,
      show: false
    });

    trackWindowState(this.windows.route, state => {
      this.state.route = state;
      this.notifyStateChange();
    });

    this.windows.route.loadURL(url);
    this.windows.route.webContents.insertCSS('body { background-color: transparent !important; }');


    this.windows.route.once('ready-to-show', () => {
      this.windows.route.show();
    });
  }

  notifyStateChange() {
    if (typeof this.onStateChange === 'function') {
      this.onStateChange(this.state);
    }
  }
}
