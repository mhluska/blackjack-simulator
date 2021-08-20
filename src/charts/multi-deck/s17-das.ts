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
// See https://wizardofodds.com/blackjack/images/bj_4d_s17.gif

export const chart: BasicStrategyChart = convertToChartMove(
  // prettier-ignore
  new Map([
    [ChartType.Hard, [
    ['H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H',  'H' ],
    ['H',  'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H' ],
    ['H',  'H',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'H',  'Rh', 'H' ],
    ['S',  'S',  'S',  'S',  'S',  'H',  'H',  'Rh', 'Rh', 'Rh'],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
  ]],

    [ChartType.Soft, [
    ['H',  'H',  'H',  'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['H',  'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H',  'H',  'H',  'H' ],
    ['S',  'Ds', 'Ds', 'Ds', 'Ds', 'S',  'S',  'H',  'H',  'H' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
  ]],

    [ChartType.Splits, [
    ['Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['Ph', 'Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['H',  'H',  'H',  'Ph', 'Ph', 'H',  'H',  'H',  'H',  'H' ],
    ['Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'Dh', 'H',  'H' ],
    ['Ph', 'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'H',  'H',  'H',  'H' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P' ],
    ['P',  'P',  'P',  'P',  'P',  'S',  'P',  'P',  'S',  'S' ],
    ['S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S',  'S' ],
    ['P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P',  'P' ],
  ]],
  ])
);

export const uncommon: UncommonChart = new Map([
  [ChartType.Hard, new Map()],
  [ChartType.Soft, new Map()],
  [ChartType.Splits, new Map()],
]);
