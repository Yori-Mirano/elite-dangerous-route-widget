const { app, BrowserWindow, screen } = require('electron');
const { trackWindowState }  = require('./utils');
const { name, version }     = require(`${__dirname}/../../package.json`);
const buildName             = `${name}-v${version}-win-x64`;

module.exports = class WindowManager {
  state = {};
  locked;
  windows = {};
  onStateChange;

  constructor(state, locked) {
    this.state = state;
    this.locked = locked;
  }

  createMain(url) {
    return new Promise(resolve => {
      this.windows.main = new BrowserWindow({
        width: 640,
        height: 150,
        resizable: false,
        maximizable: false,
        show: false,
        title: buildName,
      });
      this.windows.main.removeMenu();
      this.windows.main.loadURL(url);

      this.windows.main.on('closed', () => {
        if (process.platform !== 'darwin') {
        app.quit();
        }

        process.exit();
      });

      this.windows.main.once('ready-to-show', () => {
        this.windows.main.show();
        // this.windows.main.openDevTools({mode:'undocked'});
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
      minimizable: false,
      maximizable: false,
      show: false
    });

    this.windows.route.setAlwaysOnTop(true, 'pop-up-menu');
    this.windows.route.setIgnoreMouseEvents(this.locked);

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
