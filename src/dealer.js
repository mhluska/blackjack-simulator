const Player = require('./player');

module.exports = class Dealer extends Player {
  move() {
    console.log('dealer move');
  }
};
