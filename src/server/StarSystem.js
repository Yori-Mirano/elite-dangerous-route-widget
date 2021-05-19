module.exports = class StarSystem {
  name;
  position;

  constructor(name, position = []) {
    this.name = name;
    this.position = position;
  }
}
