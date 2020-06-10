import Utils from './utils.js';
import GameObject from './game-object.js';
import Hand from './hand.js';

export default class Player extends GameObject {
  constructor() {
    super();

    this.resetHands();
  }

  addHand(cards = []) {
    const hand = new Hand(cards);
    hand.on('change', () => this.emit('change'));
    this.hands.push(hand);
    this.emit('change');

    return hand;
  }

  resetHands() {
    this.hands = [];
    this.addHand();
  }

  takeCard(card, { hand, prepend = false } = {}) {
    if (hand) {
      console.assert(this.hands.includes(hand), 'Hand must belong to player');
    }

    const targetHand = hand || this.hands[0];
    targetHand.takeCard(card, { prepend });
    this.emit('change');
  }

  removeCards({ hand } = {}) {
    if (hand) {
      return hand.removeCards();
    } else {
      const cards = this.hands.map((hand) => hand.removeCards()).flat();
      this.resetHands();
      this.emit('change');
      return cards;
    }
  }

  attributes() {
    return {
      hands: this.hands.map((hand) => hand.attributes()),
    };
  }

  // TODO: Consider using `Proxy`.
  get cards() {
    return this.hands[0].cards;
  }

  // TODO: Consider using `Proxy`.
  get visibleCards() {
    return this.hands[0].visibleCards;
  }

  // TODO: Consider using `Proxy`.
  get busted() {
    return this.hands[0].busted;
  }

  // TODO: Consider using `Proxy`.
  get blackjack() {
    return this.hands[0].blackjack;
  }

  // TODO: Consider using `Proxy`.
  get cardTotal() {
    return this.hands[0].cardTotal;
  }

  // TODO: Consider using `Proxy`.
  get hasPairs() {
    return this.hands[0].hasPairs;
  }
}
