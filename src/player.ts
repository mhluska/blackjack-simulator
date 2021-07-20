import Utils from './utils';
import GameObject from './game-object';
import Game from './game';
import Hand, { HandAttributes } from './hand';
import Card from './card';
import BasicStrategyChecker from './basic-strategy-checker';
import HiLoDeviationChecker from './hi-lo-deviation-checker';
import {
  handWinners,
  actions,
  correctMoves,
  correctMoveToAction,
  blackjackPayouts,
} from './types';

export enum PlayerStrategy {
  USER_INPUT = 'USER_INPUT',
  BASIC_STRATEGY = 'BASIC_STRATEGY',
  BASIC_STRATEGY_BETSPREAD = 'BASIC_STRATEGY_BETSPREAD',
  BASIC_STRATEGY_BETSPREAD_I18 = 'BASIC_STRATEGY_BETSPREAD_I18',
  DEALER = 'DEALER',
}

type PlayerAttributes = {
  id: string;
  balance: number;
  hands: HandAttributes[];
  handWinner: { [id: string]: handWinners };
};

export default class Player extends GameObject {
  static entityName = 'player';

  balance: number;
  blackjackPayout: blackjackPayouts;
  debug: boolean;
  hands: Hand[];
  handWinner: Map<string, handWinners>;
  id: string;
  strategy: PlayerStrategy;

  constructor({
    balance = 10000 * 100,
    blackjackPayout = '3:2',
    debug = false,
    strategy,
  }: {
    balance?: number;
    blackjackPayout?: blackjackPayouts;
    debug?: boolean;
    strategy: PlayerStrategy;
  }) {
    super();

    this.balance = balance;
    this.blackjackPayout = blackjackPayout;
    this.debug = debug;
    this.hands = [];
    this.handWinner = new Map();
    this.id = Utils.randomId();
    this.strategy = strategy;
  }

  getNPCInput(game: Game, hand: Hand): actions | void {
    let correctMove: correctMoves | void;

    if (
      this.strategy === PlayerStrategy.BASIC_STRATEGY ||
      this.strategy === PlayerStrategy.BASIC_STRATEGY_BETSPREAD
    ) {
      correctMove = BasicStrategyChecker.suggest(game, hand);
    }

    if (this.strategy === PlayerStrategy.BASIC_STRATEGY_BETSPREAD_I18) {
      correctMove =
        HiLoDeviationChecker.suggest(game, hand) ||
        BasicStrategyChecker.suggest(game, hand);
    }

    if (this.debug) {
      console.log(
        this.strategy,
        this.id,
        'dealer',
        game.dealer.hands[0].serialize(),
        'player',
        hand.serialize(),
        `(${hand.cardTotal})`,
        correctMove
      );
    }

    if (!correctMove) {
      return;
    }

    return correctMoveToAction(correctMove);
  }

  addHand(betAmount = 0, cards: Card[] = []): Hand {
    const hand = new Hand(this, cards);
    hand.on('change', () => this.emitChange());

    this.hands.push(hand);

    if (betAmount !== 0) {
      this.useChips(betAmount, { hand });
    }

    this.emitChange();

    return hand;
  }

  takeCard(
    card: Card | void,
    { hand, prepend = false }: { hand?: Hand; prepend?: boolean } = {}
  ): void {
    if (!card) {
      return;
    }

    const targetHand = hand ?? this.hands[0] ?? this.addHand();
    targetHand.takeCard(card, { prepend });

    if (this.debug) {
      console.log(
        Utils.titleCase((this.constructor as typeof GameObject).entityName),
        this.id,
        'draws card',
        targetHand.serialize({ showHidden: true }),
        `(${targetHand.cardTotal})`
      );
    }

    this.emitChange();
  }

  removeCards({ hand }: { hand?: Hand } = {}): Card[] {
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

  attributes(): PlayerAttributes {
    // TODO: Get `Object.fromEntries` working when running `npm run test`.
    const handWinner: { [key: string]: handWinners } = {};
    for (const key of this.handWinner.keys()) {
      const value = this.handWinner.get(key);
      if (value) {
        handWinner[key] = value;
      }
    }

    return {
      id: this.id,
      balance: this.balance,
      hands: this.hands.map((hand) => hand.attributes()),
      // handWinner: Object.fromEntries(this.handWinner),
      handWinner,
    };
  }

  useChips(betAmount: number, { hand }: { hand?: Hand } = {}): void {
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
      console.log(
        'Subtracted',
        betAmount,
        'from player',
        this.id,
        'balance:',
        this.balance
      );
    }
  }

  addChips(betAmount: number): void {
    this.balance += betAmount;

    if (this.debug) {
      console.log('Adding balance', this.id, this.balance, betAmount);
    }
  }

  setHandWinner({
    hand = this.hands[0],
    winner,
    surrender = false,
  }: {
    hand?: Hand;
    winner: handWinners;
    surrender?: boolean;
  }): void {
    this.handWinner.set(hand.id, winner);

    if (this.debug) {
      console.log(
        'Hand result',
        this.id,
        'winner:',
        winner,
        hand.blackjack ? 'blackjack' : ''
      );
    }

    if (winner === 'player') {
      const [ratioNumerator, ratioDenominator] = hand.blackjack
        ? this.blackjackPayout.split(':').map((num) => parseInt(num))
        : [1, 1];

      this.addChips(
        hand.betAmount + hand.betAmount * (ratioNumerator / ratioDenominator)
      );
    } else if (winner === 'push') {
      this.addChips(hand.betAmount);
    } else if (winner === 'dealer' && surrender) {
      this.addChips(hand.betAmount / 2);
    }

    this.emit('hand-winner', hand, winner);
  }

  get isNPC(): boolean {
    return this.strategy !== PlayerStrategy.USER_INPUT;
  }

  // TODO: Consider using `Proxy`.
  get cards(): Card[] {
    return this.hands[0].cards;
  }

  // TODO: Consider using `Proxy`.
  get busted(): boolean {
    return this.hands[0].busted;
  }

  // TODO: Consider using `Proxy`.
  get blackjack(): boolean {
    return this.hands[0].blackjack;
  }

  // TODO: Consider using `Proxy`.
  get cardTotal(): number {
    return this.hands[0].cardTotal;
  }

  // TODO: Consider using `Proxy`.
  get hasPairs(): boolean {
    return this.hands[0].hasPairs;
  }

  // TODO: Consider using `Proxy`.
  get isSoft(): boolean {
    return this.hands[0].isSoft;
  }

  // TODO: Consider using `Proxy`.
  get isHard(): boolean {
    return this.hands[0].isHard;
  }
}
