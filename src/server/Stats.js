const fs              = require('fs');
const { getDistance } = require('./utils');

module.exports = class Stats {
  filename;
  historyLimit;
  durationLimit
  shipMaxJumpRange;
  remainingJumps;
  lastJumpDatetimeInMilliseconds;
  _remainingMinutes;
  _position;
  _shipId;

  onUpdate;

  stats = {};

  constructor(filename, historyLimit = 20, durationLimit = 99) {
    this.filename = filename;
    this.historyLimit = historyLimit;
    this.durationLimit = durationLimit;

    if (fs.existsSync(this.filename)) {
      this.stats = JSON.parse(fs.readFileSync(filename));
    }
  }

  update() {
    fs.writeFileSync(this.filename, JSON.stringify(this.stats, null, 2));

    if (typeof this.onUpdate === 'function') {
      this.onUpdate(this.get());
    }
  }

  get() {
    return {
      remainingJumps:     this.remainingJumps,
      remainingLightYear: this.getRemainingLightYear(),
      remainingMinutes:   this.getRemainingMinutes(),
      lightYearPerJump:   this.getLightYearPerJump(),
      lightYearPerHour:   this.getLightYearPerHour(),
      jumpsPerHour:       this.getJumpsPerHour(),
      secondsPerJump:     this.getSecondsPerJump(),
    }
  }

  changeShip(shipId) {
    this.endOfRoute();
    this._shipId = shipId;

    if (!this.stats[this._shipId]) {
      this.initStatsForShip(this._shipId);
    }
  }

  initStatsForShip(shipId) {
    this.stats[shipId] = {
      durationInSeconds: [],
      distanceInLightYears: []
    }
  }

  setRemainingJump(remainingJump) {
    this.remainingJumps = remainingJump;
    
    if (remainingJump === 0) {
      this.endOfRoute();
    }
  }

  jump(position) {
    this._updateMillisecondsPerJumpStat();
    this._updateLightYearPerJumpStat(position);
  }

  setDestinationPosition(position) {
    this.endOfRoute();
    this._destinationPosition = position;
  }

  endOfRoute() {
    this.lastJumpDatetimeInMilliseconds = null;
    //this._position = null;
  }


  setPosition(position) {
    this._position = position;
  }

  getRemainingLightYear() {
    let distance;
    
    if (this._position && this._destinationPosition) {
      distance = getDistance(this._position, this._destinationPosition);
    }
    
    return Math.round(distance);
  }

  getLightYearPerHour() {
    return Math.round(this.getLightYearPerJump() * this.getJumpsPerHour());
  }

  _updateMillisecondsPerJumpStat() { 
    const now = Date.now();

    if (this.lastJumpDatetimeInMilliseconds && this.stats[this._shipId]) {
      const stats = this.stats[this._shipId].durationInSeconds;
      const jumpDurationInMilliseconds = now - this.lastJumpDatetimeInMilliseconds;
      stats.push(Math.min(this.durationLimit, jumpDurationInMilliseconds / 1000));
      this.shiftHistory(stats);
    }

    this.lastJumpDatetimeInMilliseconds = now;
  }

  _updateLightYearPerJumpStat(position) {
    if (this.remainingJumps > 1 && this._position && this.stats[this._shipId]) {
      const stats = this.stats[this._shipId].distanceInLightYears;
      const jumpDistance = Math.round( getDistance(this._position, position) * 10 ) / 10;
      stats.push(jumpDistance);
      this.shiftHistory(stats);
    }

    this.setPosition(position);
  }

  shiftHistory(stats) {
    const overHistoryLimit = stats.length - this.historyLimit;

    if (overHistoryLimit > 0) {
      stats.splice(0, overHistoryLimit);
    }
  }

  getJumpRangeFromStats() {
    if (this.stats[this._shipId]
      && this.stats[this._shipId].distanceInLightYears
      && this.stats[this._shipId].distanceInLightYears.length) {

      const distanceStats = this.stats[this._shipId].distanceInLightYears;
      const distance      = distanceStats.reduce((distance, total) => total + distance);
      const count         = distanceStats.length;

      return distance / count;
    }

    return null;
  }

  getJumpRangeFromRoute() {
    return this.remainingJumps
          ? this.getRemainingLightYear() / this.remainingJumps
          : null;
  }

  getLightYearPerJump() {
    const jumpRange =  this.getJumpRangeFromStats()
                    || this.getJumpRangeFromRoute()
                    || this.shipMaxJumpRange;

    return Math.round(jumpRange * 10) / 10;
  }

  getSecondsPerJump() {
    if (this.stats[this._shipId]
      && this.stats[this._shipId].durationInSeconds
      && this.stats[this._shipId].durationInSeconds.length) {

      const durationStats = this.stats[this._shipId].durationInSeconds;
      const duration      = durationStats.reduce((duration, total) => total + duration);
      const count         = durationStats.length;

      return duration / count;
    }

    return 60;
  }

  getRemainingMinutes() {
    return Math.round(this.getSecondsPerJump() * this.remainingJumps / 60)
        || 0;
  }

  getJumpsPerHour() {
    return Math.round(60 * 60 / this.getSecondsPerJump());
  }
}