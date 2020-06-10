import Utils from './utils.js';
import Deck from './deck.js';
import GameObject from './game-object.js';

export default class DiscardTray extends GameObject {
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

  attributes() {
    return {
      cards: this.cards.map((card) => card.attributes()),
    };
  }
}
