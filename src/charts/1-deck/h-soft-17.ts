import { BasicStrategyChart } from '../../types';

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
//
// See https://wizardofodds.com/blackjack/images/bj_1d_h17.gif

// prettier-ignore
export default {
  chart: {
    hard: {
      7:  { 2: 'H',  3: 'H',  4: 'H',  5: 'H',  6: 'H',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      8:  { 2: 'H',  3: 'H',  4: 'H',  5: 'Dh', 6: 'Dh', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      9:  { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      10: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'H',  11: 'H'  },
      11: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'Dh', 11: 'Dh' },
      12: { 2: 'H',  3: 'H',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      13: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      14: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      15: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'Rh' },
      16: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'H',  8: 'H',  9: 'H',  10: 'Rh', 11: 'Rh' },
      17: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'Rs' },
      18: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S'  },
    },

    soft: {
      13: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
      14: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
      15: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
      16: { 2: 'H',  3: 'H',  4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
      17: { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'H', 8: 'H', 9: 'H', 10: 'H', 11: 'H' },
      18: { 2: 'S',  3: 'Ds', 4: 'Ds', 5: 'Ds', 6: 'Ds', 7: 'S', 8: 'S', 9: 'H', 10: 'H', 11: 'H' },
      19: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'Ds', 7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
      20: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S', 8: 'S', 9: 'S', 10: 'S', 11: 'S' },
    },

    splits: {
      2:  { 2: 'Ph', 3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      3:  { 2: 'Ph', 3: 'Ph', 4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'Ph', 9: 'H',  10: 'H',  11: 'H'  },
      4:  { 2: 'H',  3: 'H',  4: 'Ph', 5: 'Pd', 6: 'Pd', 7: 'H',  8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      5:  { 2: 'Dh', 3: 'Dh', 4: 'Dh', 5: 'Dh', 6: 'Dh', 7: 'Dh', 8: 'Dh', 9: 'Dh', 10: 'H',  11: 'H'  },
      6:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'Ph', 8: 'H',  9: 'H',  10: 'H',  11: 'H'  },
      7:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'Ph', 9: 'H',  10: 'Rs', 11: 'Rh' },
      8:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'P'  },
      9:  { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'S',  8: 'P',  9: 'P',  10: 'S',  11: 'Ps' },
      10: { 2: 'S',  3: 'S',  4: 'S',  5: 'S',  6: 'S',  7: 'S',  8: 'S',  9: 'S',  10: 'S',  11: 'S'  },
      11: { 2: 'P',  3: 'P',  4: 'P',  5: 'P',  6: 'P',  7: 'P',  8: 'P',  9: 'P',  10: 'P',  11: 'P'  },
    },
  } as BasicStrategyChart,

  uncommon: {},
};
