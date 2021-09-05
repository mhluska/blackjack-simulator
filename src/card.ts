import GameObject from './game-object';
import Utils from './utils';
import Shoe from './shoe';
import {
  Suit,
  Rank,
  cardRankToValue,
  suitToString,
  rankToString,
} from './types';

export type CardAttributes = {
  id: string;
  suit: string;
  rank: string;
  showingFace: boolean;
};

function hiLoValue(rank: Rank): number {
  switch (rank) {
    case Rank.Ace:
    case Rank.King:
    case Rank.Queen:
    case Rank.Jack:
    case Rank.Ten:
      return -1;
    case Rank.Nine:
    case Rank.Eight:
    case Rank.Seven:
      return 0;
    case Rank.Six:
    case Rank.Five:
    case Rank.Four:
    case Rank.Three:
    case Rank.Two:
      return 1;
  }
}

export default class Card extends GameObject {
  static entityName = 'card';

  id: string;
  suit: Suit;
  rank: Rank;
  shoe: Shoe;
  showingFace: boolean;
  value: number;
  hiLoValue: number;

  constructor(suit: Suit, rank: Rank, shoe: Shoe) {
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
      suit: suitToString(this.suit),
      rank: rankToString(this.rank),
      showingFace: this.showingFace,
    };
  }
}
