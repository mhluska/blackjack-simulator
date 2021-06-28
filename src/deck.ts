import Card from './card';
import Utils from './utils';
import GameObject from './game-object';
import Shoe from './shoe';
import { Suits, Ranks } from './types';

export default class Deck extends GameObject {
  static entityName = 'deck';

  shoe: Shoe;
  cards: Card[];

  static randomSuit(): Suits {
    return Utils.arraySample(Object.values(Suits));
  }

  static randomRank(): Ranks {
    return Utils.arraySample(Object.values(Ranks));
  }

  constructor(shoe: Shoe) {
    super();

    this.shoe = shoe;
    this.cards = this.setupCards();
  }

  setupCards(): Card[] {
    const cards: Card[] = [];

    Object.values(Suits).forEach((suit) =>
      Object.values(Ranks).forEach((rank) => cards.push(new Card(suit, rank, this.shoe)))
    );

    Utils.arrayShuffle(cards);

    return cards;
  }
}
