import Utils from './utils.js';

// prettier-ignore
// Referenced from the book `Blackjack Attack`.
// `index` means for this true count or lower/higher (based on `direction`), inclusive.
export const illustrious18Deviations = [
  // { insurance: true, dealersCard: 11, correctMove: 'Y', index: 3 }, // TODO: Add this once insurance is supported.
  { playerTotal: 16, dealersCard: 10, correctMove: 'S', index: 0,  direction: 1  },
  { playerTotal: 15, dealersCard: 10, correctMove: 'S', index: 4,  direction: 1  },
  { playerTotal: 20, dealersCard: 5,  correctMove: 'P', index: 5,  direction: 1, pair: true },
  { playerTotal: 20, dealersCard: 6,  correctMove: 'P', index: 4,  direction: 1, pair: true },
  { playerTotal: 10, dealersCard: 10, correctMove: 'D', index: 4,  direction: 1  },
  { playerTotal: 12, dealersCard: 3,  correctMove: 'S', index: 2,  direction: 1  },
  { playerTotal: 12, dealersCard: 2,  correctMove: 'S', index: 3,  direction: 1  },
  { playerTotal: 11, dealersCard: 11, correctMove: 'D', index: 1,  direction: 1  }, // TODO: Use index -1 for s17?
  { playerTotal: 9,  dealersCard: 2,  correctMove: 'D', index: 1,  direction: 1  },
  { playerTotal: 10, dealersCard: 11, correctMove: 'D', index: 3,  direction: 1  }, // TODO: Use index +4 for s17?
  { playerTotal: 9,  dealersCard: 7,  correctMove: 'D', index: 3,  direction: 1  },
  { playerTotal: 16, dealersCard: 9,  correctMove: 'S', index: 5,  direction: 1  },
  { playerTotal: 13, dealersCard: 2,  correctMove: 'H', index: -2, direction: -1 },
  { playerTotal: 12, dealersCard: 4,  correctMove: 'H', index: -1, direction: -1 },
  { playerTotal: 12, dealersCard: 5,  correctMove: 'H', index: -2, direction: -1 },
  { playerTotal: 12, dealersCard: 6,  correctMove: 'H', index: -4, direction: -1 }, // TODO: Use index -1 for s17?
  { playerTotal: 13, dealersCard: 3,  correctMove: 'H', index: -3, direction: -1 },
];

export default class HiLoDeviationChecker {
  static check(game, input) {
    const trueCount = game.shoe.hiLoTrueCount;
    const hand = game.state.focusedHand;
    const playerTotal = hand.cardTotal;
    const dealersCard = game.dealer.upcard.value;

    const deviation = illustrious18Deviations.find(
      (d) =>
        d.playerTotal === playerTotal &&
        d.dealersCard === dealersCard &&
        hand.hasPairs === !!d.pair &&
        (d.direction > 0 ? trueCount >= d.index : trueCount <= d.index)
    );

    if (!deviation) {
      return false;
    }

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
      hint: `Illustrious 18 deviation: last play should have been ${hint}!`,
    };
  }
}
