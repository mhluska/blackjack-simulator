export type actionDataKeys = 'h' | 's' | 'd' | 'p' | 'r';

// TODO: Consolidate with `actionDataKeys`.
export type correctMoves = 'H' | 'S' | 'D' | 'P' | 'R' | 'N' | 'Y';

export type actions =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'
  | 'no-insurance'
  | 'ask-insurance';

export type handWinners = 'player' | 'dealer' | 'push';

export type chartTypes = 'hard' | 'soft' | 'splits';

export type deckCounts = 1 | 2 | 4 | 6 | 8;

export enum Suits {
  HEARTS = 'HEARTS',
  DIAMONDS = 'DIAMONDS',
  CLUBS = 'CLUBS',
  SPADES = 'SPADES',
}

export enum Ranks {
  ACE = 'A',
  TWO = '2',
  THREE = '3',
  FOUR = '4',
  FIVE = '5',
  SIX = '6',
  SEVEN = '7',
  EIGHT = '8',
  NINE = '9',
  TEN = '10',
  JACK = 'J',
  QUEEN = 'Q',
  KING = 'K',
}

export type CheckResult = {
  code: correctMoves;
  hint: string;
};

type chartMoves = correctMoves & ('Dh' | 'Ds' | 'Rh' | 'Rs');
type BasicStrategyChart = Record<chartTypes, Record<number, chartMoves>>;
type UncommonChart = Record<chartTypes, Record<number, number[]>>;

export type BasicStrategyData = {
  hitsSoft17: {
    chart: BasicStrategyChart;
    uncommon: UncommonChart;
  };
};
