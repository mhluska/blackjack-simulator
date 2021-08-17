import {
  BasicStrategyChart,
  UncommonChart,
  convertToChartMove,
  ChartType,
} from '../../types';

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
// See https://wizardofodds.com/blackjack/images/bj_2d_h17.gif

// prettier-ignore
export const chart: BasicStrategyChart = convertToChartMove({
  [ChartType.Hard]: [
    ['H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh'],
    ['H',  'H',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'Rh', 'Rh'],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'Rh', 'Rh'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'Rs'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
  ],

  [ChartType.Soft]: [
    ['H',  'H',  'H',  'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Ds', 'Ds', 'Ds', 'Ds', 'Ds', 'S',  'S',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'Ds', 'S',  'S',  'S',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
  ],

  [ChartType.Splits]: [
    ['Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'Ph', 'Ph', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'Ph', 'H',  'H',  'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'Ph', 'H',  'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'Rp'],
    ['P',  'P',  'P',  'P',  'P',  'S',  'P',  'P',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P' ],
  ],
});

// prettier-ignore
export const uncommon: UncommonChart = {
  [ChartType.Hard]: {
    9:  [7],
    10: [9],
    12: [2, 3],
    15: [10, 11],
    16: [10, 11],
    17: [10, 11],
  },

  [ChartType.Soft]: {
    13: [2, 3, 4, 5],
    14: [2, 3, 4],
    15: [2, 3, 4],
    16: [2, 3, 4],
    17: [2, 3, 4],
    18: [2, 7, 8, 9],
    19: [5, 6, 7]
  },

  [ChartType.Splits]: {
    2: [7, 8],
    3: [7, 8],
    4: [2, 3, 4, 5, 6, 7],
    7: [9],
    8: [10, 11],
    9: [6, 7, 8, 9, 10, 11],
  }
};
