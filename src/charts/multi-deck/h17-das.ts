import { BasicStrategyChart, UncommonChart } from '../../types';

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
// Rp: Surrender if allowed and double after split not allowed, otherwise split
//
// See https://wizardofodds.com/blackjack/images/bj_4d_h17.gif

// prettier-ignore
export const chart: BasicStrategyChart = {
  hard: [
    ['H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H' ],
    ['H',  'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh'],
    ['H',  'H',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'Rh', 'Rh'],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'Rh', 'Rh', 'Rh'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'Rs'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
  ],

  soft: [
    ['H',  'H',  'H',  'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Ds', 'Ds', 'Ds', 'Ds', 'Ds', 'S',  'S',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'Ds', 'S',  'S',  'S',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
  ],

  splits: [
    ['Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'Ph', 'Ph', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'Rp'],
    ['P',  'P',  'P',  'P',  'P',  'S',  'P',  'P',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P' ],
  ],
};

// prettier-ignore
export const uncommon: UncommonChart = {
  hard: {
    9:  [7],
    10: [9],
    12: [2, 3],
    15: [10, 11],
    16: [10, 11],
    17: [10, 11],
  },

  soft: {
    13: [2, 3, 4, 5],
    14: [2, 3, 4],
    15: [2, 3, 4],
    16: [2, 3, 4],
    17: [2, 3, 4],
    18: [2, 7, 8, 9],
    19: [5, 6, 7]
  },

  splits: {
    2: [7, 8],
    3: [7, 8],
    4: [2, 3, 4, 5, 6, 7],
    7: [9],
    8: [10, 11],
    9: [6, 7, 8, 9, 10, 11],
  }
};
