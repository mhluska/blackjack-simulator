const Card = require('./card');
const Utils = require('./utils');
const GameObject = require('./game-object');

module.exports = class Deck extends GameObject {
  constructor() {
    super();
    this.cards = this.setupCards();
  }

  setupCards() {
    const cards = [];

    ['hearts', 'tiles', 'clovers', 'pikes'].forEach((suit) =>
      [
        'A',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '10',
        'J',
        'Q',
        'K',
      ].forEach((rank) => {
        cards.push(new Card(suit, rank));
      })
    );

    Utils.arrayShuffle(cards);

    return cards;
  }
};
