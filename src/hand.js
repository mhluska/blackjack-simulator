const GameObject = require('./game-object');
const Utils = require('./utils');

module.exports = class Hand extends GameObject {
  constructor(cards = []) {
    super();
    this.cards = cards;
  }

  takeCard(card) {
    this.cards.push(card);
    this.emit('change');
  }

  removeCards() {
    const cards = this.cards.slice();
    this.cards = [];
    this.emit('change');
    return cards;
  }

  serialize({ showHidden = false } = {}) {
    return this.cards
      .map((card) => (card.visible || showHidden ? card.rank : '?'))
      .join(' ');
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

  get acesCount() {
    return this.cards.filter((c) => c.rank === 'A').length;
  }

  get highTotal() {
    return Utils.arraySum(this.visibleCards.map((c) => c.value));
  }

  get lowTotal() {
    return Utils.arraySum(
      this.visibleCards.map((c) => (c.rank === 'A' ? 1 : c.value))
    );
  }

  get cardTotal() {
    let total = this.highTotal;
    let aCount = this.acesCount;

    // Aces can count as 1 or 11. Assume the smaller value until we run out of
    // aces or the total goes below 22.
    while (total > 21 && aCount > 0) {
      total -= 10;
      aCount -= 1;
    }

    return total;
  }

  get hasPairs() {
    return this.cards.length === 2 && this.cards[0].rank === this.cards[1].rank;
  }

  // A hand is "soft" if there is an ace and the next card will not bust:
  // 1. there's at least one ace
  // 2. counting the aces as value 1, the total is <= 11
  get isSoft() {
    return this.acesCount > 0 && this.lowTotal <= 11;
  }
};
