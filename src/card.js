const assert = require('assert');
const GameObject = require('./game-object');

module.exports = class Card extends GameObject {
  constructor(suit, rank) {
    assert(suit, 'Need to initialize Card with suit');
    assert(rank, 'Need to initialize Card with rank');

    super();

    this.suit = suit;
    this.rank = rank;
    this.showingFace = true;
  }

  flip() {
    this.showingFace = !this.showingFace;
  }

  get visible() {
    return this.showingFace;
  }

  get value() {
    switch (this.rank) {
      case 'A':
        return 11;
      case 'K':
      case 'Q':
      case 'J':
        return 10;
      default:
        return parseInt(this.rank);
    }
  }
};
