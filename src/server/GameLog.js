const fs          = require('fs');
const glob        = require('glob');
const lineReader  = require('line-reader');
const StarSystem  = require('./StarSystem');

module.exports = class GameLog {
  eliteLogDir;
  isJumping = false;
  _dirWatcher;
  _currentShip;
  _lastShipId;
  lastJumpSystem;
  _lastSystem;
  _lastLogFilePath;
  _prevLogFilePath;
  currentSystem;

  onJump;
  onLocate;
  onShipChange;

  constructor(eliteLogDir) {
    this.eliteLogDir = eliteLogDir;
  }

  watchLog() {
    let watchTimeout;

    this._dirWatcher = fs.watch(this.eliteLogDir, () => {
      if (watchTimeout) { clearTimeout(watchTimeout); } // prevent duplicated watch notifications

      watchTimeout = setTimeout(() => {
        //console.log(new Date(), 'watchLog: change detected');
        this.watchLogFromMostRecentFile();
      }, 100);
    });

    this.watchLogFromMostRecentFile();
  }

  watchLogFromMostRecentFile() {
    this._lastLogFilePath = glob.sync(this.eliteLogDir + '/*.log')
      .map(name => ({name, ctime: fs.statSync(name).ctime}))
      .sort((a, b) => b.ctime - a.ctime)[0].name;

    if (this._lastLogFilePath !== this._prevLogFilePath) {
      console.log(new Date(), 'gamelog: file used: ' + this._lastLogFilePath);
      this._prevLogFilePath = this._lastLogFilePath;

      if ( this._dirWatcher) {  this._dirWatcher.close(); }

      fs.watchFile(this._lastLogFilePath, { interval: 1000 }, () => {
        //console.log(new Date(), 'gamelog: watchLogFromMostRecentFile: change detected');
        this.dispatchLogEvents();
      });

      this.dispatchLogEvents();
    }
  }

  dispatchLogEvents() {
    lineReader.eachLine(this._lastLogFilePath, (line, last) => {
      const log = JSON.parse(line);
      let nextSystem;

      switch (log.event) {
        case 'Loadout':
          this._currentShip = {
            shipId: log.ShipID,
            ship: log.Ship,
            shipName: log.ShipName,
            shipIdent: log.ShipIdent,
            maxJumpRange: log.MaxJumpRange
          };
          break;

        case 'StartJump':
          if (log.JumpType === "Hyperspace") {
            this.isJumping = true;
            nextSystem = new StarSystem(log.StarSystem);
          }
          break;

        case 'Location':
        case 'FSDJump':
        case 'CarrierJump':
          this.isJumping = false;
          this.currentSystem = new StarSystem(log.StarSystem, log.StarPos);
          break;

        case 'Shutdown':
          fs.unwatchFile(this._lastLogFilePath);
          this.watchLog();
          break;

        default:
          // Do nothing
      }

      if (last) {
        if (this._currentShip && this._currentShip.shipId && this._lastShipId !== this._currentShip.shipId) {
          //console.log(new Date(), 'ship: [ id:', this._currentShip.shipId, '| type:', this._currentShip.ship, '| name:', this._currentShip.shipName, '| ident:', this._currentShip.shipIdent, ']');
          this._lastShipId = this._currentShip.shipId;

          if (typeof this.onShipChange === 'function') {
            this.onShipChange(this._currentShip);
          }
        }

        if (this.isJumping) {
          if ((nextSystem && nextSystem.name)
              && (!this.lastJumpSystem || (this.lastJumpSystem.name !== nextSystem.name))) {

            //console.log(new Date(), 'jumping: ', nextSystem);
            this.lastJumpSystem = nextSystem;

            if (typeof this.onJump === 'function') {
              this.onJump(nextSystem);
            }
          }

        } else if ((this.currentSystem && this.currentSystem.name)
            && (!this._lastSystem || (this._lastSystem.name !== this.currentSystem.name))) {

          //console.log(new Date(), 'system:', this.currentSystem);
          this._lastSystem = this.currentSystem;

          if (typeof this.onLocate === 'function') {
            this.onLocate(this.currentSystem);
          }
        }
      }
    });
  }
}
