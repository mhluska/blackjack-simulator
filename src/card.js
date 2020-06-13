import GameObject from './game-object.js';

export default class Card extends GameObject {
  constructor(suit, rank) {
    console.assert(suit, 'Need to initialize Card with suit');
    console.assert(rank, 'Need to initialize Card with rank');

    super();

    this.suit = suit;
    this.rank = rank;
    this.showingFace = true;
  }

  flip() {
    this.showingFace = !this.showingFace;
  }

  attributes() {
    return {
      suit: this.suit,
      rank: this.rank,
      showingFace: this.showingFace,
    };
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
}
