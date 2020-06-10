const Utils = require('./utils');
const Deck = require('./deck');
const GameObject = require('./game-object');

module.exports = class Shoe extends GameObject {
  constructor() {
    super();
    this.cards = this.setupCards();
  }

  setupCards() {
    // TODO: Support more decks.
    const decks = [new Deck()];
    let cards = [];

    while (decks.length > 0) {
      cards = cards.concat(...decks.pop().cards);
    }

    Utils.arrayShuffle(cards);

    return cards;
  }

  drawCard({ showingFace = true } = {}) {
    const card = this.cards.pop();
    card.showingFace = showingFace;

    this.emit('change');

    return card;
  }
};
