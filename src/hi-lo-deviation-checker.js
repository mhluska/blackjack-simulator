import Utils from './utils.js';

// prettier-ignore
// Referenced from the book `Blackjack Attack`.
// `index` refers to true count.
//
// TODO: Consider different deviations for deck counts and s17.
// TODO: Add the insurance deviation once it is supported in the game.
export const illustrious18Deviations = [
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
  static check(game, input) {
    const trueCount = game.shoe.hiLoTrueCount;
    const hand = game.state.focusedHand;
    const playerTotal = hand.cardTotal;
    const dealersCard = game.dealer.upcard.value;

    const deviationIndex = illustrious18Deviations.findIndex(
      (d) =>
        d.playerTotal === playerTotal &&
        d.dealersCard === dealersCard &&
        hand.hasPairs === !!d.pair &&
        Utils.compareRange(trueCount, d.index)
    );

    if (deviationIndex === -1) {
      return false;
    }

    const deviation = illustrious18Deviations[deviationIndex];
    const correctMove = deviation.correctMove;
    let hint;

    if (correctMove === 'S' && input !== 'stand') {
      hint = 'stand';
    }

    if (correctMove === 'P' && input !== 'split') {
      hint = 'split';
    }

    if (correctMove === 'D' && input !== 'double') {
      hint = 'double';
    }

    if (!hint) {
      return {
        code: null,
        hint: null,
      };
    }

    return {
      code: correctMove,
      hint: `Illustrious 18 deviation #${
        deviationIndex + 1
      }: last play should have been ${hint} for true counts ${
        deviation.index
      }!`,
    };
  }
}
