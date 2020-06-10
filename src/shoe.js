const Utils = require('./utils');
const Deck = require('./deck');
const GameObject = require('./game-object');
const DiscardTray = require('./discard-tray');

// When there are less than 20% cards in the shoe, a shuffle + reset is needed.
const RESET_THRESHOLD = 0.2;

module.exports = class Shoe extends DiscardTray {
  constructor() {
    super();

    // TODO: Support more decks.
    this.deckCount = 1;
    this.cards = this.setupCards();
  }

  setupCards() {
    const decks = [];
    for (let i = 0; i < this.deckCount; i += 1) {
      decks.push(new Deck());
    }

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

  get maxCards() {
    return this.deckCount * 52;
  }

  get needsReset() {
    return this.cards.length / this.maxCards < RESET_THRESHOLD;
  }
};
