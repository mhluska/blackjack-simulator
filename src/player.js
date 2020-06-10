const Utils = require('./utils');
const GameObject = require('./game-object');

module.exports = class Player extends GameObject {
  constructor() {
    super();
    this.cards = [];
  }

  takeCard(card) {
    this.cards.push(card);
    this.emit('change');
  }

  get visibleCards() {
    return this.cards.filter((c) => c.visible);
  }

  get busted() {
    return this.cardTotal > 21;
  }

  get blackjack() {
    return this.cards.length === 2 && this.cardTotal === 21;
  }

  get cardTotal() {
    let total = Utils.arraySum(this.visibleCards.map((c) => c.value));
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
