import GameObject from './game-object';
import Utils from './utils';
import Shoe from './shoe';
import { Suits, Ranks, dealerTotal, cardRankToValue } from './types';

export type CardAttributes = {
  id: string;
  suit: Suits;
  rank: Ranks;
  showingFace: boolean;
};

function hiLoValue(rank: Ranks): number {
  switch (rank) {
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

export default class Card extends GameObject {
  static entityName = 'card';

  id: string;
  suit: Suits;
  rank: Ranks;
  shoe: Shoe;
  showingFace: boolean;
  value: dealerTotal;
  hiLoValue: number;

  constructor(suit: Suits, rank: Ranks, shoe: Shoe) {
    super();

    this.id = Utils.randomId();
    this.suit = suit;
    this.rank = rank;
    this.shoe = shoe;
    this.showingFace = true;
    this.value = cardRankToValue(rank);
    this.hiLoValue = hiLoValue(rank);
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

  get visible(): Card['showingFace'] {
    return this.showingFace;
  }
}
