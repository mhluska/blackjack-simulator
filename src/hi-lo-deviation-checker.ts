import Utils from './utils';
import Game from './game';
import Hand from './hand';
import { actions, correctMoves, CheckResult } from './types';

type Illustrious18Deviation = {
  insurance?: boolean;
  playerTotal?: number;
  pair?: boolean;
  dealersCard: number;
  correctMove: correctMoves;
  index: string;
};

// prettier-ignore
// Referenced from the book `Blackjack Attack`.
// `index` refers to true count.
//
// TODO: Consider different deviations for deck counts and s17.
export const illustrious18Deviations: Illustrious18Deviation[] = [
  { insurance: true, dealersCard: 11, correctMove: 'Y', index: '>= 3' },
  { playerTotal: 16, dealersCard: 10, correctMove: 'S', index: '>= 0' },
  { playerTotal: 15, dealersCard: 10, correctMove: 'S', index: '>= 4' },
  { playerTotal: 20, dealersCard: 5,  correctMove: 'P', index: '>= 5', pair: true },
  { playerTotal: 20, dealersCard: 6,  correctMove: 'P', index: '>= 4', pair: true },
  { playerTotal: 10, dealersCard: 10, correctMove: 'D', index: '>= 4' },
  { playerTotal: 12, dealersCard: 3,  correctMove: 'S', index: '>= 2' },
  { playerTotal: 12, dealersCard: 2,  correctMove: 'S', index: '>= 3' },
  { playerTotal: 11, dealersCard: 11, correctMove: 'H', index: '< 1'  },
  { playerTotal: 9,  dealersCard: 2,  correctMove: 'H', index: '< 1'  },
  { playerTotal: 10, dealersCard: 11, correctMove: 'D', index: '>= 4' },
  { playerTotal: 9,  dealersCard: 7,  correctMove: 'D', index: '>= 3' },
  { playerTotal: 16, dealersCard: 9,  correctMove: 'S', index: '>= 5' },
  { playerTotal: 13, dealersCard: 2,  correctMove: 'H', index: '< -1' },
  { playerTotal: 12, dealersCard: 4,  correctMove: 'H', index: '< 0'  },
  { playerTotal: 12, dealersCard: 5,  correctMove: 'H', index: '< -2' },
  { playerTotal: 12, dealersCard: 6,  correctMove: 'H', index: '< -1' },
  { playerTotal: 13, dealersCard: 3,  correctMove: 'H', index: '< -2' },
];

export default class HiLoDeviationChecker {
  static _suggest(
    game: Game,
    hand: Hand
  ): { correctMove: correctMoves | false; deviation?: Illustrious18Deviation } {
    let deviationIndex;

    const trueCount = game.shoe.hiLoTrueCount;

    if (game.dealer.upcard.value === 'A' && game.dealer.holeCard) {
      deviationIndex = illustrious18Deviations.findIndex(
        (d) => d.insurance && Utils.compareRange(trueCount, d.index)
      );
    } else {
      const playerTotal = hand.cardTotal;
      const dealersCard = game.dealer.upcard.value;

      deviationIndex = illustrious18Deviations.findIndex(
        (d, index) =>
          index < game.settings.checkTopNDeviations &&
          d.playerTotal === playerTotal &&
          d.dealersCard === dealersCard &&
          hand.hasPairs === !!d.pair &&
          hand.isHard &&
          Utils.compareRange(trueCount, d.index)
      );
    }

    if (deviationIndex === -1) {
      return { correctMove: false };
    }

    const deviation = illustrious18Deviations[deviationIndex];
    const correctMove = deviation.correctMove;

    if (correctMove === 'D' && !hand.firstMove) {
      return { correctMove: false };
    }

    const allowSplit =
      hand.player.hands.length < game.settings.tableRules.maxHandsAllowed;
    if (correctMove === 'P' && !allowSplit) {
      return { correctMove: false };
    }

    return { correctMove, deviation };
  }

  static suggest(game: Game, hand: Hand): correctMoves | false {
    const { correctMove } = this._suggest(game, hand);
    return correctMove;
  }

  // Returns true if an Illustrious 18 deviation was followed correctly.
  // Returns false if a deviation was not present.
  // Returns an object with a `correctMove` code and a `hint` otherwise.
  static check(game: Game, hand: Hand, input: actions): CheckResult | boolean {
    if (
      !game.settings.checkDeviations &&
      game.settings.mode !== 'illustrious18'
    ) {
      return false;
    }

    const { correctMove, deviation } = this._suggest(game, hand);

    if (!correctMove) {
      return true;
    }

    let hint;

    if (correctMove === 'Y' && input !== 'ask-insurance') {
      hint = 'buy insurance';
    }

    if (correctMove === 'H' && input !== 'hit') {
      hint = 'hit';
    }

    if (correctMove === 'S' && input !== 'stand') {
      hint = 'stand';
    }

    if (correctMove === 'D' && input !== 'double') {
      hint = 'double';
    }

    if (correctMove === 'P' && input !== 'split') {
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
}
