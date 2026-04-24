import Utils from './utils';
import Game, { settings as gameSettings } from './game';
import Hand from './hand';
import {
  Move,
  GameStep,
  GameMode,
  PlayerStrategy,
  Deviation,
  Deviations,
  playerTotal,
  dealerCard,
  CheckDeviationResult,
} from './types';

// TODO: Consider different deviations for deck counts and s17?
// prettier-ignore
export const illustrious18Deviations: Deviations = new Map<playerTotal, Map<dealerCard, Deviation>>([
  [0,  new Map([
    [11, { correctMove: Move.AskInsurance, index: ['>=', 3] }],
  ]),
  ],
  [9,  new Map([
    [2,  { correctMove: Move.Double, index: ['>=',  1] }],
    [7,  { correctMove: Move.Double, index: ['>=',  3] }],
  ]),
  ],
  [10, new Map([
    [10, { correctMove: Move.Double, index: ['>=',  4] }],
    [11, { correctMove: Move.Double, index: ['>=',  4] }],
  ]),
  ],
  [11, new Map([
    [11, { correctMove: Move.Hit,    index: ['<',   1] }],
  ])
  ],
  [12, new Map([
    [2,  { correctMove: Move.Stand,  index: ['>=',  3] }],
    [3,  { correctMove: Move.Stand,  index: ['>=',  2] }],
    [4,  { correctMove: Move.Hit,    index: ['<',   0] }],
    [5,  { correctMove: Move.Hit,    index: ['<',  -2] }],
    [6,  { correctMove: Move.Hit,    index: ['<',  -1] }],
  ]),
  ],
  [13, new Map([
    [2,  { correctMove: Move.Hit,    index: ['<',  -1] }],
    [3,  { correctMove: Move.Hit,    index: ['<',  -2] }],
  ]),
  ],
  [15, new Map([
    [10, { correctMove: Move.Stand,  index: ['>=', 4] }]
  ])
  ],
  [16, new Map([
    [9,  { correctMove: Move.Stand,  index: ['>=', 5] }],
    [10, { correctMove: Move.Stand,  index: ['>=', 0] }],
  ]),
  ],
  [20, new Map([
    [5,  { correctMove: Move.Split,  index: ['>=', 5] }],
    [6,  { correctMove: Move.Split,  index: ['>=', 4] }],
  ]),
  ],
]);

// prettier-ignore
export const fab4Deviations: Deviations = new Map<playerTotal, Map<dealerCard, Deviation>>([
  [14,  new Map([
    [10, { correctMove: Move.Surrender, index: ['>=',  3], fab4: true }],
  ]),
  ],
  [15,  new Map([
    [9,  { correctMove: Move.Hit, index: ['<',  2], fab4: true }],
    [10, { correctMove: Move.Hit, index: ['<',  0], fab4: true }],
    [11, { correctMove: Move.Hit, index: ['<',  1], fab4: true }],
  ])],
]);

export default class HiLoDeviationChecker {
  static _getDeviation(
    deviations: Deviations,
    playerTotal: playerTotal,
    dealersCard: dealerCard,
  ): Deviation | undefined {
    return deviations.get(playerTotal)?.get(dealersCard);
  }

  static _suggest(
    game: Game,
    hand: Hand,
    suggestFab4 = true,
  ): Deviation | undefined {
    const trueCount = game.shoe.hiLoTrueCount;

    if (game.dealer.upcard == null) {
      return;
    }

    const isInsurance = game.state.step === GameStep.WaitingForInsuranceInput;

    // Soft hands have no play deviations in the I18, but insurance is
    // independent of the player's hand.
    if (hand.isSoft && !isInsurance) {
      return;
    }

    const playerTotal = isInsurance ? 0 : hand.cardTotal;
    const dealersCard = game.dealer.upcard.value;

    const deviation =
      hand.allowSurrender && suggestFab4
        ? (this._getDeviation(fab4Deviations, playerTotal, dealersCard) ??
          this._getDeviation(illustrious18Deviations, playerTotal, dealersCard))
        : this._getDeviation(illustrious18Deviations, playerTotal, dealersCard);

    if (
      !deviation ||
      (deviation.correctMove === Move.Double && !hand.firstMove) ||
      (deviation.correctMove === Move.Split && !hand.allowSplit) ||
      (deviation.correctMove === Move.Surrender && !hand.allowSurrender) ||
      !Utils.compareRange(trueCount, deviation.index)
    ) {
      return;
    }

    return deviation;
  }

  static suggest(game: Game, hand: Hand): Move | undefined {
    return this._suggest(
      game,
      hand,
      hand.player.strategy === PlayerStrategy.BasicStrategyI18Fab4,
    )?.correctMove;
  }

  // Insurance is purely a counting play (basic strategy always says decline).
  // The deviation checker owns both directions: buy at TC >= 3, decline below.
  static _checkInsurance(
    deviation: Deviation | undefined,
    input: Move,
  ): CheckDeviationResult {
    const noInsuranceDeviation: Deviation = {
      correctMove: Move.NoInsurance,
      index: ['<', 3],
    };

    if (deviation !== undefined) {
      if (input === Move.AskInsurance) {
        return { result: true, code: null, hint: null, deviation };
      }
      return {
        result: false,
        code: Move.AskInsurance,
        hint: `Illustrious 18 deviation: last play should have been buy insurance for true counts ${deviation.index[0]} ${deviation.index[1]}`,
        deviation,
      };
    }

    if (input === Move.AskInsurance) {
      return {
        result: false,
        code: Move.NoInsurance,
        hint: `Illustrious 18 deviation: should not buy insurance for true counts ${noInsuranceDeviation.index[0]} ${noInsuranceDeviation.index[1]}`,
        deviation: noInsuranceDeviation,
      };
    }
    return {
      result: true,
      code: null,
      hint: null,
      deviation: noInsuranceDeviation,
    };
  }

  // Returns undefined if a deviation was not present. Otherwise returns a
  // `CheckDeviationResult` object.
  static check(
    game: Game,
    hand: Hand,
    input: Move,
  ): CheckDeviationResult | undefined {
    if (
      !gameSettings.checkDeviations &&
      gameSettings.mode !== GameMode.Deviations
    ) {
      return;
    }

    const deviation = this._suggest(game, hand);

    if (game.state.step === GameStep.WaitingForInsuranceInput) {
      return this._checkInsurance(deviation, input);
    }

    if (!deviation) {
      return;
    }

    let hint;
    const { correctMove, index } = deviation;

    if (correctMove === Move.AskInsurance && input !== Move.AskInsurance) {
      hint = 'buy insurance';
    }

    if (correctMove === Move.Hit && input !== Move.Hit) {
      hint = 'hit';
    }

    if (correctMove === Move.Stand && input !== Move.Stand) {
      hint = 'stand';
    }

    if (correctMove === Move.Double && input !== Move.Double) {
      hint = 'double';
    }

    if (correctMove === Move.Split && input !== Move.Split) {
      hint = 'split';
    }

    if (hint === undefined) {
      return { result: true, code: null, hint: null, deviation };
    }

    const deviationType = deviation.fab4 === true ? 'Fab 4' : 'Illustrious 18';
    const hintMessage = `${deviationType} deviation: last play should have been ${hint} for true counts ${index[0]} ${index[1]}`;

    return {
      result: false,
      code: correctMove,
      hint: hintMessage,
      deviation,
    };
  }
}
