import assert from 'assert';

import GameObject from './game-object.js';
import Utils from './utils.js';

export default class Card extends GameObject {
  static entityName = 'card';

  constructor(suit, rank, shoe) {
    assert(suit, 'Need to initialize Card with suit');
    assert(rank, 'Need to initialize Card with rank');
    assert(shoe, 'Need to initialize Card with shoe');

    super();

    this.id = Utils.randomId();
    this.suit = suit;
    this.rank = rank;
    this.shoe = shoe;
    this.showingFace = true;
  }

  flip() {
    this.showingFace = !this.showingFace;

    this.shoe.hiLoRunningCount += (this.showingFace ? 1 : -1) * this.hiLoValue;

    this.emitChange();
  }

  attributes() {
    return {
      id: this.id,
      suit: this.suit,
      rank: this.rank,
      showingFace: this.showingFace,
    };
  }

  get hiLoValue() {
    switch (this.rank) {
      case 'A':
      case 'K':
      case 'Q':
      case 'J':
      case '10':
        return -1;
      case '9':
      case '8':
      case '7':
        return 0;
      case '6':
      case '5':
      case '4':
      case '3':
      case '2':
        return 1;
    }
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
