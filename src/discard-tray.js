const Utils = require('./utils');
const Deck = require('./deck');
const GameObject = require('./game-object');

module.exports = class DiscardTray extends GameObject {
  constructor() {
    super();
    this.cards = [];
  }

  addCard(card) {
    if (card.showingFace) {
      card.showingFace = false;
    }

    this.cards.push(card);
  }

  addCards(cards) {
    cards.forEach((card) => this.addCard(card));
  }

  removeCards() {
    const cards = this.cards.slice();
    this.cards = [];
    return cards;
  }
};
