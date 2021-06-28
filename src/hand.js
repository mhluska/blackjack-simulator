import GameObject from './game-object.js';
import Utils from './utils.js';

export default class Hand extends GameObject {
  static entity = 'hand';

  constructor(player, cards = []) {
    super();

    this.id = Utils.randomId();
    this.player = player;
    this.fromSplit = false;
    this.betAmount = 0;
    this.cardTotal = 0;
    this.cardLowTotal = 0;
    this.acesCount = 0;
    this.cards = [];

    cards.forEach((card) => this.takeCard(card));
  }

  takeCard(card, { prepend = false } = {}) {
    card.on('change', () => this.emitChange());

    this.cards[prepend ? 'unshift' : 'push'](card);
    this.cardTotal += card.value;
    this.cardLowTotal += card.rank === 'A' ? 1 : card.value;

    if (card.rank === 'A') {
      this.acesCount += 1;
    }

    if (this.cardTotal > 21 && card.rank === 'A') {
      this.cardTotal -= 10;
    }

    this.emitChange();
  }

  removeCard() {
    const card = this.cards.pop();

    this.cardTotal -= card.value;
    this.cardLowTotal -= card.rank === 'A' ? 1 : card.value;

    if (card.rank === 'A') {
      this.acesCount -= 1;

      if (this.cardTotal + 10 <= 21) {
        this.cardTotal += 10;
      }
    }

    return card;
  }

  // TODO: Remove change handler when removing cards.
  removeCards() {
    const cards = this.cards.slice();
    this.cards = [];
    this.cardTotal = 0;
    this.cardLowTotal = 0;
    this.acesCount = 0;

    this.emitChange();

    return cards;
  }

  serialize({ showHidden = false } = {}) {
    return this.cards
      .map((card) => (card.visible || showHidden ? card.rank : '?'))
      .join(' ');
  }

  attributes() {
    return {
      id: this.id,
      cards: this.cards.map((card) => card.attributes()),
      hasPairs: this.hasPairs,
      cardTotal: this.cardTotal,
      blackjack: this.blackjack,
      firstMove: this.firstMove,
    };
  }

  get firstMove() {
    return this.cards.length <= 2;
  }

  get busted() {
    return this.cardTotal > 21;
  }

  get blackjack() {
    return this.cards.length === 2 && this.cardTotal === 21 && !this.fromSplit;
  }

  get finished() {
    return this.busted || this.blackjack;
  }

  get hasPairs() {
    return (
      this.cards.length === 2 && this.cards[0].value === this.cards[1].value
    );
  }

  // A hand is "soft" if there is an ace and the next card will not bust:
  // 1. there's at least one ace
  // 2. counting the aces as value 1, the total is <= 11
  get isSoft() {
    return this.acesCount > 0 && this.cardLowTotal <= 11;
  }

  get isHard() {
    return !this.isSoft;
  }
}
