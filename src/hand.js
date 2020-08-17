import GameObject from './game-object.js';
import Utils from './utils.js';

export default class Hand extends GameObject {
  constructor(cards = [], { fromSplit = false } = {}) {
    super();

    this.id = Utils.randomId();
    this.fromSplit = fromSplit;
    this.betAmount = 0;
    this.cards = [];

    cards.forEach((card) => this.takeCard(card));
  }

  takeCard(card, { prepend = false } = {}) {
    card.on('change', () => this.emit('change'));
    this.cards[prepend ? 'unshift' : 'push'](card);
    this.emit('change');
  }

  // TODO: Remove change handler when removing cards.
  removeCards() {
    const cards = this.cards.slice();
    this.cards = [];
    this.emit('change');
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

  get visibleCards() {
    return this.cards.filter((c) => c.visible);
  }

  get busted() {
    return this.cardTotal > 21;
  }

  get blackjack() {
    return this.cards.length === 2 && this.cardTotal === 21 && !this.fromSplit;
  }

  get acesCount() {
    return this.cards.filter((c) => c.rank === 'A').length;
  }

  get highTotal() {
    return Utils.arraySum(this.visibleCards.map((c) => c.value));
  }

  get lowTotal() {
    return Utils.arraySum(
      this.visibleCards.map((c) => (c.rank === 'A' ? 1 : c.value))
    );
  }

  get cardTotal() {
    let total = this.highTotal;
    let aCount = this.acesCount;

    // Aces can count as 1 or 11. Assume the smaller value until we run out of
    // aces or the total goes below 22.
    while (total > 21 && aCount > 0) {
      total -= 10;
      aCount -= 1;
    }

    return total;
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
    return this.acesCount > 0 && this.lowTotal <= 11;
  }

  get isHard() {
    return !this.isSoft;
  }
}
