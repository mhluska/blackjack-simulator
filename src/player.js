import Utils from './utils.js';
import GameObject from './game-object.js';
import Hand from './hand.js';
import BasicStrategyChecker from './basic-strategy-checker.js';
import HiLoDeviationChecker from './hi-lo-deviation-checker.js';

export const PLAYER_STRATEGY = {
  USER_INPUT: 'USER_INPUT',
  BASIC_STRATEGY: 'BASIC_STRATEGY',
  BASIC_STRATEGY_I18: 'BASIC_STRATEGY_I18',
};

export default class Player extends GameObject {
  static entityName = 'player';

  constructor({ strategy, balance = 10000 * 100, debug = false } = {}) {
    super();

    this.id = Utils.randomId();
    this.strategy = strategy;
    this.balance = balance;
    this.handWinner = new Map();
    this.hands = [];
    this.debug = debug;
  }

  getNPCInput(game, hand) {
    let correctMove;

    if (this.strategy === PLAYER_STRATEGY.BASIC_STRATEGY) {
      correctMove = BasicStrategyChecker.suggest(game, hand);
    }

    if (this.strategy === PLAYER_STRATEGY.BASIC_STRATEGY_I18) {
      correctMove =
        HiLoDeviationChecker.suggest(game, hand) ||
        BasicStrategyChecker.suggest(game, hand);
    }

    if (this.debug) {
      console.log(
        this.strategy,
        this.id,
        'dealer',
        game.dealer.upcard.rank,
        'player',
        hand.cardTotal,
        correctMove
      );
    }

    return {
      D: 'double',
      H: 'hit',
      N: 'no-insurance',
      Y: 'ask-insurance',
      P: 'split',
      R: 'surrender',
      S: 'stand',
    }[correctMove];
  }

  addHand(betAmount = 0, cards = []) {
    const hand = new Hand(this, cards);
    hand.on('change', () => this.emitChange());

    this.hands.push(hand);
    this.useChips(betAmount, { hand });

    this.emitChange();

    return hand;
  }

  takeCard(card, { hand, prepend = false } = {}) {
    const targetHand = hand ?? this.hands[0] ?? this.addHand();
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
      this.hands = [];
      this.emitChange();
      return cards;
    }
  }

  attributes() {
    return {
      id: this.id,
      balance: this.balance,
      hands: this.hands.map((hand) => hand.attributes()),
      handWinner: this.handWinner,
    };
  }

  useChips(betAmount, { hand } = {}) {
    if (!hand) {
      hand = this.hands[0];
    }

    if (!hand) {
      throw new Error(`Player ${this.id} has no hand to add chips to`);
    }

    if (this.balance < hand.betAmount) {
      // TODO: Format cents.
      throw new Error(
        `Insufficient player balance: ${this.balance} < ${betAmount}`
      );
    }

    hand.betAmount += betAmount;
    this.balance -= betAmount;

    if (this.debug) {
      console.log('Subtracting balance', this.id, this.balance, hand.betAmount);
    }
  }

  addChips(betAmount) {
    this.balance += betAmount;

    if (this.debug) {
      console.log('Adding balance', this.id, this.balance, betAmount);
    }
  }

  setHandWinner({ hand = this.hands[0], winner, surrender = false } = {}) {
    this.handWinner.set(hand.id, winner);

    if (this.debug) {
      console.log(
        'Hand result',
        this.id,
        winner,
        hand.blackjack ? 'blackjack' : ''
      );
    }

    if (winner === 'player') {
      this.addChips(
        hand.blackjack ? hand.betAmount * (5 / 2) : hand.betAmount * 2
      );
    } else if (winner === 'push') {
      this.addChips(hand.betAmount);
    } else if (winner === 'dealer' && surrender) {
      this.addChips(hand.betAmount / 2);
    }

    this.emit('hand-winner', hand, winner);
  }

  get isNPC() {
    return this.strategy !== PLAYER_STRATEGY.USER_INPUT;
  }

  // TODO: Consider using `Proxy`.
  get cards() {
    return this.hands[0].cards;
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

  // TODO: Consider using `Proxy`.
  get isSoft() {
    return this.hands[0].isSoft;
  }

  // TODO: Consider using `Proxy`.
  get isHard() {
    return this.hands[0].isHard;
  }
}
