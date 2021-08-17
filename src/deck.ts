import Card from './card';
import Utils from './utils';
import GameObject from './game-object';
import Shoe from './shoe';
import { Suit, Rank, values } from './types';

export default class Deck extends GameObject {
  static entityName = 'deck';

  shoe: Shoe;
  cards: Card[];

  static randomSuit(): Suit {
    return Utils.arraySample(values(Suit));
  }

  static randomRank(): Rank {
    return Utils.arraySample(values(Rank));
  }

  constructor(shoe: Shoe) {
    super();

    this.shoe = shoe;
    this.cards = this.setupCards();
  }

  setupCards(): Card[] {
    const cards: Card[] = [];

    values(Suit)
      .filter((s) => typeof s === 'number')
      .forEach((suit) =>
        values(Rank)
          .filter((r) => typeof r === 'number')
          .forEach((rank) => cards.push(new Card(suit, rank, this.shoe)))
      );

    Utils.arrayShuffle(cards);

    return cards;
  }
}
