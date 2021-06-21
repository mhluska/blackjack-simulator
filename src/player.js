import assert from 'assert';

import Utils from './utils.js';
import GameObject from './game-object.js';
import Hand from './hand.js';
import BasicStrategyChecker from './basic-strategy-checker.js';

export const PLAYER_STRATEGY = {
  USER_INPUT: 'USER_INPUT',
  PERFECT_BASIC_STRATEGY: 'PERFECT_BASIC_STRATEGY',
};

export default class Player extends GameObject {
  static entityName = 'player';

  constructor({ strategy, balance = 10000 * 100 } = {}) {
    super();

    this.strategy = strategy;
    this.balance = balance;
    this.handWinner = {};
    this.resetHands();
  }

  getNPCInput(game, hand) {
    let correctMove;

    if (this.strategy === PLAYER_STRATEGY.PERFECT_BASIC_STRATEGY) {
      correctMove = BasicStrategyChecker.suggest(game, hand);
    }

    // TODO: Add devations for NPCs.

    return {
      D: 'double',
      H: 'hit',
      N: 'no-insurance',
      P: 'split',
      R: 'surrender',
      S: 'stand',
    }[correctMove];
  }

  addHand(cards = [], betAmount = 0) {
    const hand = new Hand(cards, { fromSplit: true });
    hand.on('change', () => this.emitChange());

    this.hands.push(hand);
    this.useChips(betAmount, { hand });

    this.emitChange();

    return hand;
  }

  resetHands() {
    this.hands = [];
    this.addHand();
  }

  takeCard(card, { hand, prepend = false } = {}) {
    if (hand) {
      assert(this.hands.includes(hand), 'Hand must belong to player');
    }

    const targetHand = hand || this.hands[0];
    targetHand.takeCard(card, { prepend });

    this.emitChange();
  }

  removeCards({ hand } = {}) {
    if (hand) {
      return hand.removeCards();
    } else {
      const cards = Utils.arrayFlatten(
        this.hands.map((hand) => hand.removeCards())
      );
      this.resetHands();
      this.emitChange();
      return cards;
    }
  }

  attributes() {
    return {
      balance: this.balance,
      hands: this.hands.map((hand) => hand.attributes()),
      handWinner: this.handWinner,
    };
  }

  useChips(betAmount, { hand } = {}) {
    if (hand) {
      assert(this.hands.includes(hand), 'Hand must belong to player');
    } else {
      hand = this.hands[0];
    }

    if (this.balance < betAmount) {
      // TODO: Format cents.
      throw new Error(
        `Insufficient player balance: ${this.balance} < ${betAmount}`
      );
    }

    this.balance -= betAmount;
    hand.betAmount = betAmount;
  }

  addChips(betAmount) {
    this.balance += betAmount;
  }

  setHandWinner({ hand = this.hands[0], winner } = {}) {
    this.handWinner[hand.id] = winner;

    if (winner === 'player') {
      this.addChips(hand.betAmount * 2);
    } else if (winner === 'push') {
      this.addChips(hand.betAmount);
    }

    this.emit('hand-winner', hand, winner);
  }

  get isUser() {
    return this.strategy === PLAYER_STRATEGY.USER_INPUT;
  }

  get isNPC() {
    return !this.isUser;
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
