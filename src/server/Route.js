const fs = require('fs');

module.exports = class Route {
  filename;
  steps;
  onChange;

  constructor(filename) {
    this.filename = filename;
  }

  watchFile() {
    this.updateFromFile();

    let watchTimeout;

    fs.watch(this.filename, () => {
      if (watchTimeout) { clearTimeout(watchTimeout); } // prevent duplicated watch notifications

      watchTimeout = setTimeout(() => {
        //console.log(new Date(), 'watchRoute: change detected');
        this.updateFromFile();
      }, 100);
    });
  }

  updateFromFile() {
    this.steps = JSON.parse(fs.readFileSync(this.filename)).Route;
    //console.log(new Date(), 'route:', this.steps.length -1, 'steps');

    this.update();
  }

  update() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.steps);
    }
  }

  getRemainingJump(currentSystemName) {
    let remainingJump = 0;

    this.steps.forEach((system, index) => {
      if (currentSystemName === system.StarSystem) {
        remainingJump = this.steps.length -1 - index;
      }
    });

    return remainingJump;
  }

  getStepByName(name) {
    return this.steps.find(step => step.StarSystem === name);
  }
}
