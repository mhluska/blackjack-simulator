import Utils from './utils';
import Game, { GameSettings } from './game';
import Hand from './hand';
import { Move, CheckResult, GameStep, GameMode } from './types';

type Illustrious18Deviation = {
  correctMove: Move;
  index: [string, number];
};

// TODO: Consider different deviations for deck counts and s17.
// prettier-ignore
export const illustrious18Deviations = new Map<number, Map<number, Illustrious18Deviation>>([
  [0,  new Map([
    [11, { correctMove: Move.AskInsurance, index: ['>=', 3] }],
  ]),
  ],
  [9,  new Map([
    [2,  { correctMove: Move.Hit,          index: ['<',  1] }],
    [7,  { correctMove: Move.Double,       index: ['>=', 3] }],
  ]),
  ],
  [10, new Map([
    [10, { correctMove: Move.Double,       index: ['>=', 4] }],
    [11, { correctMove: Move.Double,       index: ['>=', 4] }],
  ]),
  ],
  [11, new Map([
    [11, { correctMove: Move.Hit,          index: ['<',  1] }],
  ])
  ],
  [12, new Map([
    [2,  { correctMove: Move.Stand,        index: ['>=', 3] }],
    [3,  { correctMove: Move.Stand,        index: ['>=', 2] }],
    [4,  { correctMove: Move.Hit,          index: ['<',  0] }],
    [5,  { correctMove: Move.Hit,          index: ['<', -2] }],
    [6,  { correctMove: Move.Hit,          index: ['<', -1] }],
  ]),
  ],
  [13, new Map([
    [2,  { correctMove: Move.Hit,          index: ['<', -1] }],
    [3,  { correctMove: Move.Hit,          index: ['<', -2] }],
  ]),
  ],
  [15, new Map([
    [10, { correctMove: Move.Stand,        index: ['>=', 4] }]
  ])
  ],
  [16, new Map([
    [9,  { correctMove: Move.Stand,        index: ['>=', 5] }],
    [10, { correctMove: Move.Stand,        index: ['>=', 0] }],
  ]),
  ],
  [20, new Map([
    [5,  { correctMove: Move.Split,        index: ['>=', 5] }],
    [6,  { correctMove: Move.Split,        index: ['>=', 4] }],
  ]),
  ],
]);

export default class HiLoDeviationChecker {
  static _suggest(
    game: Game,
    hand: Hand
  ): {
    correctMove: Move | false;
    deviation?: Illustrious18Deviation;
  } {
    const trueCount = game.shoe.hiLoTrueCount;

    if (!game.dealer.upcard || hand.isSoft) {
      return { correctMove: false };
    }

    const playerTotal =
      game.state.step === GameStep.WaitingForInsuranceInput
        ? 0
        : hand.cardTotal;
    const dealersCard = game.dealer.upcard.value;
    const deviation = illustrious18Deviations
      .get(playerTotal)
      ?.get(dealersCard);

    if (
      !deviation ||
      (hand.hasPairs && deviation.correctMove !== Move.Split) ||
      (!hand.firstMove && deviation.correctMove === Move.Double) ||
      (!this._allowSplit(hand, game.settings) &&
        deviation.correctMove === Move.Split) ||
      !Utils.compareRange(trueCount, deviation.index)
    ) {
      return { correctMove: false };
    }

    return { correctMove: deviation.correctMove, deviation };
  }

  static suggest(game: Game, hand: Hand): Move | false {
    return this._suggest(game, hand).correctMove;
  }

  // Returns true if an Illustrious 18 deviation was followed correctly.
  // Returns false if a deviation was not present.
  // Returns an object with a `correctMove` code and a `hint` otherwise.
  static check(game: Game, hand: Hand, input: Move): CheckResult | boolean {
    if (
      !game.settings.checkDeviations &&
      game.settings.mode !== GameMode.Illustrious18
    ) {
      return false;
    }

    const { correctMove, deviation } = this._suggest(game, hand);

    if (!correctMove) {
      return true;
    }

    let hint;

    if (
      correctMove === (Move.AskInsurance as Move) &&
      input !== Move.AskInsurance
    ) {
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

    let hintMessage = `Illustrious 18 deviation: last play should have been ${hint}`;
    if (deviation) {
      hintMessage += ' for true counts ${deviation.index}';
    }

    return {
      code: correctMove,
      hint: hintMessage,
    };
  }

  // TODO: DRY with `BasicStrategyChecker` or move these `_allow*` functions
  // into `Hand`.
  static _allowSplit(hand: Hand, settings: GameSettings): boolean {
    return (
      hand.player.handsCount < settings.maxHandsAllowed &&
      (!hand.hasAces || settings.allowResplitAces)
    );
  }
}
