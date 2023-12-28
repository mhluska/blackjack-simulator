import EventEmitter, { Event } from './event-emitter';
import Utils from './utils';
import Shoe, { OutOfCardsError } from './shoe';
import Dealer from './dealer';
import Player from './player';
import BasicStrategyChecker from './basic-strategy-checker';
import HiLoDeviationChecker from './hi-lo-deviation-checker';
import Hand from './hand';
import {
  Move,
  SimpleObject,
  TableRules,
  GameStep,
  HandWinner,
  PlayerStrategy,
  BlackjackPayout,
  GameMode,
  CheckDeviationResult,
  CheckResult,
} from './types';

export type GameSettings = {
  autoDeclineInsurance: boolean;
  disableEvents: boolean;
  checkDeviations: boolean;
  mode: GameMode;
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
  step: GameStep;
  sessionMovesTotal: number;
  sessionMovesCorrect: number;
  focusedHandIndex: number;
};

function defaultSettings(minimumBet = 10 * 100): GameSettings {
  return {
    autoDeclineInsurance: false,
    disableEvents: false,
    checkDeviations: false,

    // Can be one of 'GameMode.Default', 'GameMode.Pairs', 'GameMode.Uncommon',
    // 'GameMode.Deviations'. If the mode is set to 'GameMode.Deviations',
    // `checkDeviations` will be forced to true.
    mode: GameMode.Default,
    debug: false,

    playerBankroll: minimumBet * 1000 * 1000,
    playerTablePosition: 1,
    playerStrategyOverride: {},

    // Table rules
    allowDoubleAfterSplit: true,
    allowLateSurrender: false,
    allowResplitAces: false,
    blackjackPayout: BlackjackPayout.ThreeToTwo,
    deckCount: 2,
    hitSoft17: true,
    maxHandsAllowed: 4,
    maximumBet: minimumBet * 100,
    minimumBet,
    playerCount: 1,
    penetration: 0.75,
  };
}

export const SETTINGS_DEFAULTS = defaultSettings();
export let settings: GameSettings;

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
  shoe!: Shoe;
  state!: GameState;

  constructor(gameSettings: Partial<GameSettings> = SETTINGS_DEFAULTS) {
    super();

    settings = defaultSettings();
    this.updateSettings(gameSettings);
    this.betAmount = settings.minimumBet;
    this.spotCount = 1;

    if (settings.disableEvents) {
      EventEmitter.disableEvents = true;
    }

    this.setupState();
  }

  get focusedHand(): Hand {
    return this.player.getHand(this.state.focusedHandIndex);
  }

  updateSettings(gameSettings: Partial<GameSettings>): GameSettings {
    return Utils.merge(settings, gameSettings);
  }

  setupState(): void {
    // We assign a random ID to each game so that we can link hand results with
    // wrong moves in the database.
    this.gameId = Utils.randomId();

    this.shoe = this.chainEmitChange(new Shoe());
    this.dealer = this.chainEmitChange(
      new Dealer({
        handsMax: settings.maxHandsAllowed,
        debug: settings.debug,
        strategy: PlayerStrategy.Dealer,
      })
    );

    this.players = Array.from(
      { length: settings.playerCount },
      (_item, index) =>
        this.chainEmitChange(
          new Player({
            handsMax: settings.maxHandsAllowed,
            balance: settings.playerBankroll,
            blackjackPayout: settings.blackjackPayout,
            debug: settings.debug,
            // TODO: Make this configurable for each player.
            strategy:
              settings.playerStrategyOverride[index + 1] ??
              (index === settings.playerTablePosition - 1
                ? PlayerStrategy.UserInput
                : PlayerStrategy.BasicStrategy),
          })
        )
    );

    // We reverse the players array for convenience since reverse iteration in
    // JS is difficult.
    this.players.reverse();

    const reversedTablePosition =
      this.players.length - settings.playerTablePosition + 1;

    this.player = this.players[reversedTablePosition - 1];
    this.playersLeft = this.players.slice(reversedTablePosition);
    this.playersRight = this.players.slice(0, reversedTablePosition - 1);

    this.player.on(Event.HandWinner, (hand, winner) => {
      this.emit(Event.CreateRecord, 'hand-result', {
        createdAt: Date.now(),
        gameId: this.gameId,
        dealerHand: this.dealer.firstHand.serialize({ showHidden: true }),
        playerHand: hand.serialize(),
        winner,
      });
    });

    this._state = {
      focusedHandIndex: 0,
      playCorrection: '',
      sessionMovesCorrect: 0,
      sessionMovesTotal: 0,
      step: GameStep.Start,
    };

    const hasKey = <T extends SimpleObject>(
      obj: T,
      k: string | number | symbol
    ): k is keyof T => k in obj;

    this.state = settings.disableEvents
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
              this.emit(Event.Change, key, value.attributes());
            } else {
              this.emit(Event.Change, key, value);
            }

            return true;
          },
        });
  }

  resetState(): void {
    this.setupState();
    this.emit(Event.ResetState);
  }

  allPlayerHandsBusted(): boolean {
    return this.players.every((player) =>
      player.hands.every((hand) => hand.busted || hand.blackjack)
    );
  }

  chainEmitChange<T extends EventEmitter>(object: T): T {
    object.on(Event.Change, (name: string, value: SimpleObject) =>
      this.emit(Event.Change, name, value)
    );
    return object;
  }

  getCheckerResult(
    hiLoResult: CheckDeviationResult | undefined,
    basicStrategyResult: CheckResult,
    input: Move
  ): CheckDeviationResult | CheckResult {
    // A basic strategy split takes priority over any deviation.
    // For example pair 6s vs 2 should be a split even though I18 says to hit.
    if (input === Move.Split && basicStrategyResult.result) {
      return basicStrategyResult;
    }

    // A basic strategy surrender takes priority over non-Fab4 deviations.
    // For example 15v10 should be a surrender even though I18 says to hit.
    if (input === Move.Surrender && basicStrategyResult.result) {
      return hiLoResult?.deviation.fab4 ? hiLoResult : basicStrategyResult;
    }

    return hiLoResult || basicStrategyResult;
  }

  validateInput(input: Move, hand: Hand): void {
    const hiLoResult = HiLoDeviationChecker.check(this, hand, input);
    const basicStrategyResult = BasicStrategyChecker.check(this, hand, input);

    const checkerResult = this.getCheckerResult(
      hiLoResult,
      basicStrategyResult,
      input
    );

    if (checkerResult.hint) {
      this.state.playCorrection = checkerResult.hint;
    } else {
      this.state.sessionMovesCorrect += 1;
    }

    this.state.sessionMovesTotal += 1;

    this.emit(Event.CreateRecord, 'move', {
      createdAt: Date.now(),
      gameId: this.gameId,
      dealerHand: this.dealer.firstHand.serialize({ showHidden: true }),
      playerHand: this.focusedHand.serialize(),
      move: input,
      correction: typeof checkerResult === 'object' ? checkerResult.code : null,
    });
  }

  isValidPlayHandsInput(input: Move | undefined): input is Move {
    if (this.player.isNPC) {
      return true;
    }

    if (
      !input ||
      ![Move.Hit, Move.Stand, Move.Double, Move.Split, Move.Surrender].includes(
        input
      )
    ) {
      return false;
    }

    if (input === Move.Surrender && !this.focusedHand.allowSurrender) {
      return false;
    }

    if (input === Move.Split && !this.focusedHand.allowSplit) {
      return false;
    }

    if (input === Move.Double && !this.focusedHand.allowDouble) {
      return false;
    }

    return true;
  }

  isValidInsuranceInput(input: Move | undefined): input is Move {
    if (this.player.isNPC) {
      return true;
    }

    return !!input && [Move.AskInsurance, Move.NoInsurance].includes(input);
  }

  step(input?: Move): GameStep {
    let step: GameStep = this.state.step;

    try {
      switch (step) {
        case GameStep.Start:
          step = this.dealInitialCards();
          break;

        case GameStep.WaitingForInsuranceInput:
          if (!this.isValidInsuranceInput(input)) {
            break;
          }

          this.askInsurance(input, this.player, ...this.playersLeft);
          this.payoutInsurance(input);
          step = GameStep.PlayHandsRight;
          break;

        case GameStep.PlayHandsRight:
          this.playNPCHands(...this.playersRight);
          step = this.setblackjackWinner(this.player, this.focusedHand)
            ? GameStep.PlayHandsLeft
            : GameStep.WaitingForPlayInput;
          break;

        case GameStep.WaitingForPlayInput:
          if (!this.isValidPlayHandsInput(input)) {
            break;
          }

          if (this.player.isUser) {
            step = this.playUserHands(input);
          } else {
            this.playNPCHands(this.player);
            step = GameStep.PlayHandsLeft;
          }

          break;

        case GameStep.PlayHandsLeft:
          this.playNPCHands(...this.playersLeft);
          this.playDealer();
          step = GameStep.WaitingForNewGameInput;
          break;

        case GameStep.WaitingForNewGameInput:
          if (this.player.isUser && !input) {
            break;
          }
          this.removeCards();
          step = GameStep.Start;
      }
    } catch (error) {
      if (error instanceof OutOfCardsError) {
        this.pushAllPlayersHands();
        step = GameStep.WaitingForNewGameInput;
      } else {
        throw error;
      }
    }

    this.state.step = step;

    return step;
  }

  run(betAmount: number, spotCount: number): void {
    this.betAmount = betAmount;
    this.spotCount = spotCount;

    let nextStep: GameStep = this.state.step;

    do {
      nextStep = this.step();
    } while (nextStep !== GameStep.Start);
  }

  dealInitialCards(): GameStep {
    if (settings.debug) {
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
          player === this.player ? this.betAmount : settings.minimumBet
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
      player.eachHand((hand) => {
        player.takeCard(this.shoe.drawCard(), { hand });
      });
    }

    // Draw card for dealer face down (hole card).
    this.dealer.takeCard(this.shoe.drawCard({ showingFace: false }), {
      prepend: true,
    });

    // Dealer peeks at the hole card if the upcard is 10 to check blackjack.
    if (this.dealer.upcard.value === 10 && this.dealer.holeCard.value === 11) {
      this.dealer.firstHand.incrementTotalsForCard(this.dealer.cards[0]);
      this.dealer.cards[0].flip();

      for (const player of this.players) {
        player.eachHand((hand) => {
          player.setHandWinner({ winner: HandWinner.Dealer, hand });
        });
      }

      return GameStep.WaitingForNewGameInput;
    }

    // Dealer peeks at the hole card if the upcard is ace to ask insurance.
    if (this.dealer.upcard.value === 11) {
      this.askInsurance(null, ...this.playersRight);

      if (!settings.autoDeclineInsurance) {
        return GameStep.WaitingForInsuranceInput;
      }
    }

    return GameStep.PlayHandsRight;
  }

  askInsurance(userInput: Move | null | undefined, ...players: Player[]): void {
    for (const player of players) {
      player.eachHand((hand) => {
        const input =
          player.isUser && userInput
            ? userInput
            : player.getNPCInput(this, hand);

        // TODO: Make insurance amount configurable. Currently uses half the bet
        // size as insurance to recover full bet amount.
        const amount =
          player === this.player ? this.betAmount : settings.minimumBet;

        if (input === Move.AskInsurance) {
          player.useChips(amount / 2, { hand });
        }
      });
    }
  }

  payoutInsurance(userInput: Move | undefined): void {
    if (this.dealer.holeCard?.value !== 10) {
      return;
    }

    for (const player of this.players) {
      player.eachHand((hand) => {
        player.setHandWinner({ winner: HandWinner.Dealer, hand });

        // TODO: Store this in state so we don't have to check it again.
        const input = player.isUser
          ? userInput
          : player.getNPCInput(this, hand);

        if (input === Move.AskInsurance) {
          // TODO: Make insurance amount configurable. Currently uses half the
          // bet size as insurance to recover full bet amount.
          player.addChips(
            player === this.player ? this.betAmount : settings.minimumBet
          );
        }
      });
    }
  }

  setblackjackWinner(player: Player, hand: Hand): boolean {
    if (this.dealer.blackjack && hand.blackjack) {
      player.setHandWinner({ winner: HandWinner.Push, hand });
      return true;
    } else if (this.dealer.blackjack) {
      player.setHandWinner({ winner: HandWinner.Dealer, hand });
      return true;
    } else if (hand.blackjack) {
      player.setHandWinner({ winner: HandWinner.Player, hand });
      return true;
    }

    return false;
  }

  stepHand(
    player: Player,
    hand: Hand,
    betAmount: number,
    input: Move
  ): boolean {
    if (this.setblackjackWinner(player, hand)) {
      return true;
    }

    if (hand.cardTotal <= 21) {
      if (!player.isNPC) {
        this.validateInput(input, hand);
      }

      if (input === Move.Hit) {
        player.takeCard(this.shoe.drawCard(), { hand });
      }

      if (input === Move.Stand) {
        return true;
      }

      if (input === Move.Double) {
        player.useChips(betAmount, { hand });
        player.takeCard(this.shoe.drawCard(), { hand });
      }

      if (input === Move.Split && hand.allowSplit) {
        const newHandCard = hand.removeCard();
        const newHand = player.addHand(betAmount, [newHandCard]);

        hand.splitCount += 1;
        newHand.splitCount = hand.splitCount;

        player.takeCard(this.shoe.drawCard(), { hand });
        player.takeCard(this.shoe.drawCard(), { hand: newHand });

        if (hand.hasAces) {
          return true;
        }
      }

      if (input === Move.Surrender) {
        player.setHandWinner({
          winner: HandWinner.Dealer,
          hand,
          surrender: true,
        });

        return true;
      }
    }

    if (hand.busted) {
      if (settings.debug) {
        console.log(`Busted ${player.id} ${hand.cardTotal}`);
      }

      player.setHandWinner({ winner: HandWinner.Dealer, hand });

      return true;
    }

    if (input === Move.Double) {
      return true;
    }

    if (hand.cardTotal === 21) {
      return true;
    }

    return false;
  }

  playNPCHands(...players: Player[]): void {
    for (const player of players) {
      player.eachHand((hand) => {
        let handFinished = false;

        while (!handFinished) {
          handFinished = this.stepHand(
            player,
            hand,
            player === this.player ? this.betAmount : settings.minimumBet,
            player.getNPCInput(this, hand)
          );
        }
      });
    }
  }

  playUserHands(input: Move): GameStep {
    const handFinished = this.stepHand(
      this.player,
      this.focusedHand,
      this.betAmount,
      input
    );

    if (handFinished) {
      if (this.state.focusedHandIndex < this.player.handsCount - 1) {
        this.state.focusedHandIndex += 1;
      } else {
        return GameStep.PlayHandsLeft;
      }
    }

    // If aces were split, we may have to advance focus multiple times.
    while (
      this.state.focusedHandIndex < this.player.handsCount - 1 &&
      this.focusedHand.finished
    ) {
      this.state.focusedHandIndex += 1;
    }

    return this.focusedHand.finished
      ? GameStep.PlayHandsLeft
      : GameStep.WaitingForPlayInput;
  }

  playDealer(): void {
    this.dealer.firstHand.incrementTotalsForCard(this.dealer.cards[0]);
    this.dealer.cards[0].flip();

    // Dealer draws cards until they reach 17. However, if all player hands have
    // busted, this step is skipped.
    // TODO: Move this into `getNPCInput()` for `PlayerStrategy.DEALER`.
    if (!this.allPlayerHandsBusted()) {
      while (this.dealer.cardTotal <= 17 && !this.dealer.blackjack) {
        if (
          this.dealer.cardTotal === 17 &&
          (this.dealer.isHard || !settings.hitSoft17)
        ) {
          break;
        }

        this.dealer.takeCard(this.shoe.drawCard());
      }
    }

    for (const player of this.players) {
      player.eachHand((hand) => {
        if (player.handWinner.get(hand.id)) {
          return;
        }

        if (this.dealer.busted) {
          player.setHandWinner({ winner: HandWinner.Player, hand });
        } else if (this.dealer.cardTotal > hand.cardTotal) {
          player.setHandWinner({ winner: HandWinner.Dealer, hand });
        } else if (hand.cardTotal > this.dealer.cardTotal) {
          player.setHandWinner({ winner: HandWinner.Player, hand });
        } else {
          player.setHandWinner({ winner: HandWinner.Push, hand });
        }
      });
    }
  }

  pushAllPlayersHands(): void {
    for (const player of this.players) {
      player.eachHand((hand) => {
        player.setHandWinner({ winner: HandWinner.Push, hand });
      });
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
      if (settings.debug) {
        console.log('Cut card reached');
      }
      this.shoe.resetCards();
      this.emit(Event.Shuffle);
    }

    if (settings.debug) {
      console.log('End of hand', this.shoe.serialize());
      console.log();
    }
  }
}
