import EventEmitter from './event-emitter';
import Utils from './utils';
import Shoe from './shoe';
import Dealer from './dealer';
import Player, { PlayerStrategy } from './player';
import BasicStrategyChecker from './basic-strategy-checker';
import HiLoDeviationChecker from './hi-lo-deviation-checker';
import Hand from './hand';
import {
  actions,
  DeepPartial,
  SimpleObject,
  TableRules,
  gameSteps,
} from './types';

export type GameSettings = {
  animationDelay: number;
  autoDeclineInsurance: boolean;
  disableEvents: boolean;
  checkDeviations: boolean;
  checkTopNDeviations: number;
  mode: 'default' | 'pairs' | 'uncommon' | 'illustrious18';
  debug: boolean;
  playerBankroll: number;
  playerTablePosition: number;
  playerStrategyOverride: {
    [index: number]: PlayerStrategy;
  };

  element?: string;
} & TableRules;

type GameState = {
  playCorrection: string;
  step: gameSteps;
  sessionMovesTotal: number;
  sessionMovesCorrect: number;
  focusedHandIndex: number;
};

const MINIMUM_BET = 10 * 100;

export const SETTINGS_DEFAULTS: GameSettings = {
  animationDelay: 200,
  autoDeclineInsurance: false,
  disableEvents: false,
  checkDeviations: false,
  checkTopNDeviations: 18,

  // Can be one of 'default', 'pairs', 'uncommon', 'illustrious18'. If the mode
  // is set to 'illustrious18', `checkDeviations` will be forced to true.
  mode: 'default',
  debug: false,

  playerBankroll: MINIMUM_BET * 1000 * 1000,
  playerTablePosition: 1,
  playerStrategyOverride: {},

  // Table rules
  allowDoubleAfterSplit: true,
  allowLateSurrender: false,
  blackjackPayout: '3:2',
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: MINIMUM_BET * 100,
  minimumBet: MINIMUM_BET,
  playerCount: 1,
};

export default class Game extends EventEmitter {
  _state!: GameState;
  betAmount!: number;
  spotCount!: number;
  dealer!: Dealer;
  gameId!: string;
  player!: Player;
  players!: Player[];
  playersLeft!: Player[];
  playersRight!: Player[];
  settings: GameSettings;
  shoe!: Shoe;
  state!: GameState;

  constructor(settings: DeepPartial<GameSettings> = SETTINGS_DEFAULTS) {
    super();

    this.settings = Utils.mergeDeep(SETTINGS_DEFAULTS, settings);
    this.betAmount = this.settings.minimumBet;
    this.spotCount = 1;

    if (this.settings.disableEvents) {
      EventEmitter.disableEvents = true;
    }

    this.setupState();
  }

  get focusedHand(): Hand {
    return this.player.hands[this.state.focusedHandIndex];
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
  }

  setupState(): void {
    // We assign a random ID to each game so that we can link hand results with
    // wrong moves in the database.
    this.gameId = Utils.randomId();

    this.shoe = this.chainEmitChange(new Shoe({ settings: this.settings }));
    this.dealer = this.chainEmitChange(
      new Dealer({
        debug: this.settings.debug,
        strategy: PlayerStrategy.DEALER,
      })
    );

    this.players = Array.from(
      { length: this.settings.playerCount },
      (_item, index) =>
        this.chainEmitChange(
          new Player({
            balance: this.settings.playerBankroll,
            blackjackPayout: this.settings.blackjackPayout,
            debug: this.settings.debug,
            // TODO: Make this configurable for each player.
            strategy:
              this.settings.playerStrategyOverride[index + 1] ??
              (index === this.settings.playerTablePosition - 1
                ? PlayerStrategy.USER_INPUT
                : PlayerStrategy.BASIC_STRATEGY),
          })
        )
    );

    // We reverse the players array for convenience since reverse iteration in
    // JS is difficult.
    this.players.reverse();

    const reversedTablePosition =
      this.players.length - this.settings.playerTablePosition + 1;

    this.player = this.players[reversedTablePosition - 1];
    this.playersLeft = this.players.slice(reversedTablePosition);
    this.playersRight = this.players.slice(0, reversedTablePosition - 1);

    this.player.on('hand-winner', (hand, winner) => {
      this.emit('create-record', 'hand-result', {
        createdAt: Date.now(),
        gameId: this.gameId,
        dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
        playerHand: hand.serialize(),
        winner,
      });
    });

    this._state = {
      focusedHandIndex: 0,
      playCorrection: '',
      sessionMovesCorrect: 0,
      sessionMovesTotal: 0,
      step: 'start',
    };

    const hasKey = <T extends SimpleObject>(
      obj: T,
      k: string | number | symbol
    ): k is keyof T => k in obj;

    this.state = this.settings.disableEvents
      ? this._state
      : new Proxy(this._state, {
          set: (target, key, value) => {
            if (hasKey(target, key)) {
              // TODO: Fix this TypeScript issue.
              // eslint-disable-next-line @typescript-eslint/ban-ts-comment
              // @ts-ignore Type 'any' is not assignable to type 'never'.
              target[key] = value;
            }

            if (typeof value === 'object' && value.attributes) {
              this.emit('change', key, value.attributes());
            } else {
              this.emit('change', key, value);
            }

            return true;
          },
        });
  }

  resetState(): void {
    this.setupState();
    this.emit('resetState');
  }

  allPlayerHandsFinished(): boolean {
    return this.players.every((player) =>
      player.hands.every((hand) => hand.finished)
    );
  }

  chainEmitChange<T extends EventEmitter>(object: T): T {
    object.on('change', (name: string, value: SimpleObject) =>
      this.emit('change', name, value)
    );
    return object;
  }

  validateInput(input: actions, hand: Hand): void {
    const checkerResult =
      HiLoDeviationChecker.check(this, hand, input) ||
      BasicStrategyChecker.check(this, hand, input);

    if (typeof checkerResult === 'object' && checkerResult.hint) {
      this.state.playCorrection = checkerResult.hint;
    } else {
      this.state.sessionMovesCorrect += 1;
    }

    this.state.sessionMovesTotal += 1;

    this.emit('create-record', 'move', {
      createdAt: Date.now(),
      gameId: this.gameId,
      dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
      playerHand: this.focusedHand.serialize(),
      move: input,
      correction: typeof checkerResult === 'object' ? checkerResult.code : null,
    });
  }

  isValidPlayHandsInput(input: actions | undefined): input is actions {
    if (this.player.isNPC) {
      return true;
    }

    if (
      !input ||
      !['hit', 'stand', 'double', 'split', 'surrender'].includes(input)
    ) {
      return false;
    }

    if (
      input === 'surrender' &&
      (!this.settings.allowLateSurrender || !this.focusedHand.firstMove)
    ) {
      return false;
    }

    if (
      input === 'split' &&
      (!this.focusedHand.hasPairs || !this.focusedHand.firstMove)
    ) {
      return false;
    }

    if (input === 'double' && !this.focusedHand.firstMove) {
      return false;
    }

    return true;
  }

  isValidInsuranceInput(input: actions | undefined): input is actions {
    if (this.player.isNPC) {
      return true;
    }

    return !!input && ['ask-insurance', 'no-insurance'].includes(input);
  }

  step(input?: actions): gameSteps {
    let step: gameSteps = this.state.step;

    switch (step) {
      case 'start':
        step = this.dealInitialCards();
        break;

      case 'waiting-for-insurance-input':
        if (!this.isValidInsuranceInput(input)) {
          break;
        }

        this.askInsurance(input, this.player, ...this.playersLeft);
        this.payoutInsurance(input);
        step = 'play-hands-right';
        break;

      case 'play-hands-right':
        this.playNPCHands(...this.playersRight);
        step = this.setBlackjackWinner(this.player, this.focusedHand)
          ? 'play-hands-left'
          : 'waiting-for-play-input';
        break;

      case 'waiting-for-play-input':
        if (!this.isValidPlayHandsInput(input)) {
          break;
        }

        if (this.player.isUser) {
          step = this.playUserHands(input);
        } else {
          this.playNPCHands(this.player);
          step = 'play-hands-left';
        }
        break;

      case 'play-hands-left':
        this.playNPCHands(...this.playersLeft);
        this.playDealer();
        step = 'waiting-for-new-game-input';
        break;

      case 'waiting-for-new-game-input':
        if (this.player.isUser && !input) {
          break;
        }
        this.removeCards();
        step = 'start';
    }

    this.state.step = step;

    return step;
  }

  run(betAmount: number, spotCount: number): void {
    this.betAmount = betAmount;
    this.spotCount = spotCount;

    let nextStep: gameSteps = this.state.step;

    do {
      nextStep = this.step();
    } while (nextStep !== 'start');
  }

  dealInitialCards(): gameSteps {
    if (this.settings.debug) {
      console.log(`> Starting new hand (player ID ${this.player.id})`);
      console.log('Shoe:', this.shoe.serialize());
    }

    for (const player of this.players) {
      // Clears the result from the previous iteration. Otherwise this object
      // will grow indefinitely over subsequent `step()` calls.
      player.handWinner = new Map();

      for (
        let i = 0;
        i < (player === this.player ? this.spotCount : 1);
        i += 1
      ) {
        // TODO: Make NPCs bet more realistically than minimum bet.
        const hand = player.addHand(
          player === this.player ? this.betAmount : this.settings.minimumBet
        );

        // Draw card for each player face up (upcard).
        player.takeCard(this.shoe.drawCard(), { hand });
      }
    }

    // Draw card for dealer face up.
    this.dealer.addHand();
    this.dealer.takeCard(this.shoe.drawCard());

    // Draw card for each player face up again (upcard).
    for (const player of this.players) {
      for (const hand of player.hands) {
        player.takeCard(this.shoe.drawCard(), { hand });
      }
    }

    // Draw card for dealer face down (hole card).
    this.dealer.takeCard(this.shoe.drawCard({ showingFace: false }), {
      prepend: true,
    });

    // Dealer peeks at the hole card if the upcard is 10 to check blackjack.
    if (this.dealer.upcard.value === 10 && this.dealer.holeCard.value === 11) {
      this.dealer.cards[0].flip();
      this.dealer.hands[0].incrementTotalsForCard(this.dealer.cards[0]);

      for (const player of this.players) {
        for (const hand of player.hands) {
          player.setHandWinner({ winner: 'dealer', hand });
        }
      }

      return 'waiting-for-new-game-input';
    }

    // Dealer peeks at the hole card if the upcard is ace to ask insurance.
    if (this.dealer.upcard.value === 11) {
      this.askInsurance(null, ...this.playersRight);

      if (!this.settings.autoDeclineInsurance) {
        return 'waiting-for-insurance-input';
      }
    }

    return 'play-hands-right';
  }

  askInsurance(
    userInput: actions | null | undefined,
    ...players: Player[]
  ): void {
    for (const player of players) {
      for (const hand of player.hands) {
        const input =
          player.isUser && userInput
            ? userInput
            : player.getNPCInput(this, hand);

        // TODO: Make insurance amount configurable. Currently uses half the bet
        // size as insurance to recover full bet amount.
        const amount =
          player === this.player ? this.betAmount : this.settings.minimumBet;

        if (input === 'ask-insurance') {
          player.useChips(amount / 2, { hand });
        }
      }
    }
  }

  payoutInsurance(userInput: actions | undefined): void {
    if (this.dealer.holeCard?.value !== 10) {
      return;
    }

    for (const player of this.players) {
      for (const hand of player.hands) {
        player.setHandWinner({ winner: 'dealer', hand });

        // TODO: Store this in state so we don't have to check it again.
        const input = player.isUser
          ? userInput
          : player.getNPCInput(this, hand);

        if (input === 'ask-insurance') {
          // TODO: Make insurance amount configurable. Currently uses half the
          // bet size as insurance to recover full bet amount.
          player.addChips(
            player === this.player ? this.betAmount : this.settings.minimumBet
          );
        }
      }
    }
  }

  setBlackjackWinner(player: Player, hand: Hand): boolean {
    if (this.dealer.blackjack && hand.blackjack) {
      player.setHandWinner({ winner: 'push', hand });
      return true;
    } else if (this.dealer.blackjack) {
      player.setHandWinner({ winner: 'dealer', hand });
      return true;
    } else if (hand.blackjack) {
      player.setHandWinner({ winner: 'player', hand });
      return true;
    }

    return false;
  }

  stepHand(
    player: Player,
    hand: Hand,
    betAmount: number,
    input: actions
  ): boolean {
    if (this.setBlackjackWinner(player, hand)) {
      return true;
    }

    if (hand.cardTotal < 21) {
      if (!player.isNPC) {
        this.validateInput(input, hand);
      }

      if (input === 'hit') {
        player.takeCard(this.shoe.drawCard(), { hand });
      }

      if (input === 'stand') {
        return true;
      }

      if (input === 'double') {
        player.useChips(betAmount, { hand });
        player.takeCard(this.shoe.drawCard(), { hand });
      }

      if (
        input === 'split' &&
        player.hands.length < this.settings.maxHandsAllowed
      ) {
        const newHandCard = hand.removeCard();

        // In practice this will never happen since the hand will always have
        // a card at this point. It just makes TypeScript happy.
        if (!newHandCard) {
          return true;
        }

        const newHand = player.addHand(betAmount, [newHandCard]);

        newHand.fromSplit = true;
        hand.fromSplit = true;

        player.takeCard(this.shoe.drawCard(), { hand });
        player.takeCard(this.shoe.drawCard(), { hand: newHand });
      }

      if (input === 'surrender') {
        player.setHandWinner({
          winner: 'dealer',
          hand,
          surrender: true,
        });

        return true;
      }
    }

    if (hand.busted) {
      if (this.settings.debug) {
        console.log(`Busted ${player.id} ${hand.cardTotal}`);
      }

      player.setHandWinner({ winner: 'dealer', hand });

      return true;
    }

    if (input === 'double') {
      return true;
    }

    if (hand.cardTotal === 21) {
      return true;
    }

    return false;
  }

  playNPCHands(...players: Player[]): void {
    for (const player of players) {
      for (const hand of player.hands) {
        let handFinished = false;

        while (!handFinished) {
          handFinished = this.stepHand(
            player,
            hand,
            player === this.player ? this.betAmount : this.settings.minimumBet,
            player.getNPCInput(this, hand)
          );
        }
      }
    }
  }

  playUserHands(input: actions): gameSteps {
    const handFinished = this.stepHand(
      this.player,
      this.focusedHand,
      this.betAmount,
      input
    );

    if (handFinished) {
      if (this.state.focusedHandIndex < this.player.hands.length - 1) {
        this.state.focusedHandIndex += 1;
      } else {
        return 'play-hands-left';
      }
    }

    return 'waiting-for-play-input';
  }

  playDealer(): void {
    this.dealer.cards[0].flip();
    this.dealer.hands[0].incrementTotalsForCard(this.dealer.cards[0]);

    // Dealer draws cards until they reach 17. However, if all player hands have
    // busted, this step is skipped.
    // TODO: Move this into `getNPCInput()` for `PlayerStrategy.DEALER`.
    if (!this.allPlayerHandsFinished()) {
      while (this.dealer.cardTotal <= 17 && !this.dealer.blackjack) {
        if (
          this.dealer.cardTotal === 17 &&
          (this.dealer.isHard || !this.settings.hitSoft17)
        ) {
          break;
        }

        this.dealer.takeCard(this.shoe.drawCard());
      }
    }

    for (const player of this.players) {
      for (const hand of player.hands) {
        if (player.handWinner.get(hand.id)) {
          continue;
        }

        if (this.dealer.busted) {
          player.setHandWinner({ winner: 'player', hand });
        } else if (this.dealer.cardTotal > hand.cardTotal) {
          player.setHandWinner({ winner: 'dealer', hand });
        } else if (hand.cardTotal > this.dealer.cardTotal) {
          player.setHandWinner({ winner: 'player', hand });
        } else {
          player.setHandWinner({ winner: 'push', hand });
        }
      }
    }
  }

  removeCards(): void {
    this.state.playCorrection = '';
    this.state.focusedHandIndex = 0;

    for (const player of this.players) {
      player.removeCards();
    }

    this.dealer.removeCards();

    if (this.shoe.needsReset) {
      if (this.settings.debug) {
        console.log('Cut card reached');
      }
      this.shoe.resetCards();
      this.emit('shuffle');
    }

    if (this.settings.debug) {
      console.log('End of hand', this.shoe.serialize());
      console.log();
    }
  }
}
