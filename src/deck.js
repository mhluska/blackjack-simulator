import Card from './card.js';
import Utils from './utils.js';
import GameObject from './game-object.js';

const suits = ['hearts', 'tiles', 'clovers', 'pikes'];
const ranks = [
  'A',
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
];

export default class Deck extends GameObject {
  static randomSuit() {
    return Utils.arraySample(suits);
  }

  static randomRank() {
    return Utils.arraySample(ranks);
  }

  constructor(shoe) {
    console.assert(shoe, 'Need to initialize Deck with shoe');

    super();

    this.shoe = shoe;
    this.cards = this.setupCards();
  }

  setupCards() {
    const cards = [];

    suits.forEach((suit) =>
      ranks.forEach((rank) => cards.push(new Card(suit, rank, this.shoe)))
    );

    Utils.arrayShuffle(cards);

    return cards;
  }
}
