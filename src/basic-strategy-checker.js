// Chart symbols:
// H:  Hit
// S:  Stand
// Dh: Double if allowed, otherwise hit
// Ds: Double if allowed, otherwise split
// P:  Split
// Ph: Split if double after split is allowed, otherwise hit
// Pd: Split if double after split is allowed, otherwise double
// Rh: Surrender if allowed, otherwise hit
// Rs: Surrender if allowed, otherwise stand

// TODO: Add more basic strategy charts.
// TODO: Should this only be used for the first card?
// prettier-ignore
const CHARTS = {
  singleDeck: {
    // See https://wizardofodds.com/blackjack/images/bj_1d_s17.gif
    standsSoft17: {
      hard: {
        5:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        6:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        7:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        8:  { 2: 'H',  3: 'H',  4: 'H',  5: 'Dh', 6: 'Dh', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        9:  { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        10: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'H',  A: 'H'  },
        11: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'Dh', A: 'Dh' },
        12: { 2: 'H',  3: 'H',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        13: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        14: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        15: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  A: 'H'  },
        16: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'Rh', A: 'Rh' },
        17: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  A: 'S'  },
      },

      // TODO: Finish this.
      soft: {
      },

      // TODO: Finish this.
      splits: {
      },
    },

    // TODO: Does this vary for different decks/rules?
    shouldTakeInsurance: false,
  }
}

module.exports = class BasicStrategyChecker {
  static check(game, input) {
    // TODO: Consider soft and splits.
    const chart = CHARTS.singleDeck.standsSoft17.hard;
    const chartMax = Math.max(
      ...Object.keys(chart).map((key) => parseInt(key))
    );

    const dealersCard = game.dealer.upcard.value;
    const playerTotal = Math.min(game.player.cardTotal, chartMax);
    const dealerHints = chart[playerTotal];

    // NOTE: This should never happen but just in case.
    if (!dealerHints) {
      return `Warning: unable to find hint for ${playerTotal} vs ${dealersCard}`;
    }

    const correctMove = dealerHints[dealersCard];

    let hint;

    // TODO: Add rationale for each hint.
    if (correctMove === 'H' && input !== 'hit') {
      hint = 'hit';
    }

    if (correctMove === 'S' && input !== 'stand') {
      hint = 'stand';
    }

    if (correctMove === 'Dh' && input !== 'double') {
      hint = 'double (or hit if not allowed)';
    }

    if (correctMove === 'Ds' && input !== 'double') {
      hint = 'double (or stand if not allowed)';
    }

    if (correctMove === 'P' && input !== 'split') {
      hint = 'split';
    }

    if (correctMove === 'Ph' && input !== 'split') {
      hint = 'split (or hit if double after split not allowed)';
    }

    if (correctMove === 'Pd' && input !== 'split') {
      hint = 'split (or double if double after split not allowed)';
    }

    if (correctMove === 'Rh' && input !== 'surrender') {
      hint = 'surrender (or hit if not allowed)';
    }

    if (correctMove === 'Rs' && input !== 'surrender') {
      hint = 'surrender (or stand if not allowed)';
    }

    if (hint) {
      return `Last play should have been ${hint}!`;
    }
  }
};
