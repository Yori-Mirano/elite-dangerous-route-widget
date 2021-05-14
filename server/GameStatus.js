const fs = require('fs');

module.exports = class Status {
  filename;
  status;
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
        console.log(new Date(), 'watchStatus: change detected');
        this.updateFromFile();
      }, 100);
    });
  }

  updateFromFile() {
    this.status = JSON.parse(fs.readFileSync(this.filename));
    //console.log(new Date(), 'status:', this.status);
  
    this.update();
  }
  
  update() {
    if (typeof this.onChange === 'function') {
      this.onChange(this.status);
    }
  }
}