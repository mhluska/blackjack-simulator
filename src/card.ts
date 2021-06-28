import GameObject from './game-object';
import Utils from './utils';
import Shoe from './shoe';
import { Suits, Ranks } from './types';

export type CardAttributes = {
  id: string;
  suit: Suits;
  rank: Ranks;
  showingFace: boolean;
};

export default class Card extends GameObject {
  static entityName = 'card';

  id: string;
  suit: Suits;
  rank: Ranks;
  shoe: Shoe;
  showingFace: boolean;

  constructor(suit: Suits, rank: Ranks, shoe: Shoe) {
    super();

    this.id = Utils.randomId();
    this.suit = suit;
    this.rank = rank;
    this.shoe = shoe;
    this.showingFace = true;
  }

  flip(): void {
    this.showingFace = !this.showingFace;

    this.shoe.hiLoRunningCount += (this.showingFace ? 1 : -1) * this.hiLoValue;

    this.emitChange();
  }

  attributes(): CardAttributes {
    return {
      id: this.id,
      suit: this.suit,
      rank: this.rank,
      showingFace: this.showingFace,
    };
  }

  get hiLoValue(): number {
    switch (this.rank) {
      case Ranks.ACE:
      case Ranks.KING:
      case Ranks.QUEEN:
      case Ranks.JACK:
      case Ranks.TEN:
        return -1;
      case Ranks.NINE:
      case Ranks.EIGHT:
      case Ranks.SEVEN:
        return 0;
      case Ranks.SIX:
      case Ranks.FIVE:
      case Ranks.FOUR:
      case Ranks.THREE:
      case Ranks.TWO:
        return 1;
    }
  }

  get visible(): Card['showingFace'] {
    return this.showingFace;
  }

  get value(): number {
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
