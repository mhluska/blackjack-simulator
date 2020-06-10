const Player = require('./player');

module.exports = class Dealer extends Player {
  get upcard() {
    return this.cards[0];
  }
};
