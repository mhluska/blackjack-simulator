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
// See https://wizardofodds.com/blackjack/images/bj_1d_h17.gif

// prettier-ignore
export const chart: BasicStrategyChart = convertToChartMove({
  [ChartType.Hard]: [
    ['H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh'],
    ['H',  'H',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'Rh'],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'Rh', 'Rh'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'Rs'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
  ],

  [ChartType.Soft]: [
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['S',  'Ds', 'Ds', 'Ds', 'Ds', 'S',  'S',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'Ds', 'S',  'S',  'S',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'Ds', 'S',  'S',  'S',  'S',  'S' ],
  ],

  [ChartType.Splits]: [
    ['Ph', 'P',  'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['Ph', 'Ph', 'P',  'P',  'P',  'P',  'Ph', 'H',  'H',  'H' ],
    ['H',  'H',  'Ph', 'Pd', 'Pd', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'Ph', 'H',  'H',  'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'Ph', 'H',  'Rs', 'Rh'],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P' ],
    ['P',  'P',  'P',  'P',  'P',  'S',  'P',  'P',  'S',  'Ps'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P' ],
  ]
});

export const uncommon: UncommonChart = {
  [ChartType.Hard]: [[]],
  [ChartType.Soft]: [[]],
  [ChartType.Splits]: [[]],
};
