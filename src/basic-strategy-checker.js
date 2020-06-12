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
        5:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        6:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        7:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        8:  { 2: 'H',  3: 'H',  4: 'H',  5: 'Dh', 6: 'Dh', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        9:  { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        10: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'H',  11: 'H'  },
        11: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'Dh', 11: 'Dh' },
        12: { 2: 'H',  3: 'H',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        13: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        14: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        15: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
        16: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'Rh', 11: 'Rh' },
        17: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S'  },
      },

      soft: {
        13: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
        14: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
        15: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
        16: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
        17: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
        18: { 2: 'S',  3: 'Ds', 4: 'Ds', 5: 'Ds', 6: 'Ds', 7: 'S', 8: 'S', 9: 'H', 10: 'H', 11: 'S' },
        19: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'Ds', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
        20: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
      },

      splits: {
        2:  { 2: 'Ph', 3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
        3:  { 2: 'Ph', 3: 'Ph', 4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'Ph', 9: 'H',  10: 'H',  11: 'H' },
        4:  { 2: 'H',  3: 'H',  4: 'Ph', 5: 'Pd', 6: 'Pd', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H' },
        5:  { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'H',  11: 'H' },
        6:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'Ph', 8: 'H',  9: 'H',  10: 'H',  11: 'H' },
        7:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'Ph', 9: 'H',  10: 'Rs', 11: 'H' },
        8:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'P' },
        9:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'S',  8: 'P',  9: 'P',  10: 'S',  11: 'S' },
        10: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S' },
        11: { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'P' },
      },
    },

    // TODO: Does this vary for different decks/rules?
    shouldTakeInsurance: false,
  }
}

export default class BasicStrategyChecker {
  static getChartType(hand) {
    if (hand.hasPairs) {
      return 'splits';
    } else if (hand.isSoft) {
      return 'soft';
    } else {
      return 'hard';
    }
  }

  static check(game, input) {
    const hand = game.state.focusedHand;
    const chartType = this.getChartType(hand);

    // TODO: Consider other game modes later.
    const chart = CHARTS.singleDeck.standsSoft17[chartType];
    const chartMax = Math.max(
      ...Object.keys(chart).map((key) => parseInt(key))
    );

    const dealersCard = game.dealer.upcard.value;
    const playerTotal = Math.min(
      hand.hasPairs ? hand.cards[0].value : hand.cardTotal,
      chartMax
    );
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
      return {
        code: correctMove,
        hint: `Last play should have been ${hint}!`,
      };
    } else {
      return {
        code: null,
        hint: null,
      };
    }
  }
}
