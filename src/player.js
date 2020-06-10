const Utils = require('./utils');
const GameObject = require('./game-object');

module.exports = class Player extends GameObject {
  constructor() {
    super();
    this.cards = [];
  }

  move(input) {
    switch (input) {
      case 'hit':
        break;
      case 'stand':
        break;
      case 'double':
        break;
      case 'split':
        break;
    }
  }

  takeCard(card) {
    this.cards.push(card);
    this.emit('change');
  }

  busted() {
    return this.cardTotal > 21;
  }

  blackjack() {
    return this.cardTotal === 21;
  }

  get cardTotal() {
    const total = Utils.arraySum(this.cards.map((c) => c.value));
    let acesCount = this.cards.filter((c) => c.rank === 'A').length;

    // Aces can count as 1 or 11. Assume the smaller value until we run out of
    // aces or the total goes below 22.
    while (total > 21 && acesCount > 0) {
      total -= 10;
      acesCount -= 1;
    }

    return total;
  }
};
