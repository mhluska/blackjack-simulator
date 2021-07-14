export type actionDataKeys = 'h' | 's' | 'd' | 'p' | 'r' | 'n' | 'y';

// TODO: Consolidate with `actionDataKeys`.
export type correctMoves = 'H' | 'S' | 'D' | 'P' | 'R' | 'N' | 'Y';

export type actions =
  | 'hit'
  | 'stand'
  | 'double'
  | 'split'
  | 'surrender'
  | 'no-insurance'
  | 'ask-insurance'
  | 'next-game';

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

export type playerTotal =
  | 0
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21;

export type dealerTotal = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export type cardValue = 1 | dealerTotal;

type chartMoves =
  | correctMoves
  | 'Dh'
  | 'Ds'
  | 'Rh'
  | 'Rs'
  | 'Ph'
  | 'Pd'
  | 'Ps'
  | 'Rp';

export type BasicStrategyChart = {
  [key in chartTypes]: {
    [total in playerTotal]?: { [total in dealerTotal]: chartMoves };
  };
};

export type UncommonChart = {
  [key in chartTypes]: { [total in playerTotal]?: dealerTotal[] };
};

export type BasicStrategyData = {
  hitsSoft17: {
    chart: BasicStrategyChart;
    uncommon: UncommonChart;
  };
};

// TODO: Avoid any here.
export type SimpleObject = {
  [key: string]: any;
};

export type DeepPartial<T> = {
  [P in keyof T]?: DeepPartial<T[P]>;
};

// See https://github.com/microsoft/TypeScript/pull/12253#issuecomment-353494273
export const keys = Object.keys as <T>(o: T) => (keyof T)[];

// See https://github.com/microsoft/TypeScript/pull/12253#issuecomment-479851685
export const entries = Object.entries as <T>(o: T) => [keyof T, T[keyof T]][];

// TODO: Consolidate types so we can remove these converter functions?
export function cardValueToRank(integerRank: cardValue): Ranks {
  switch (integerRank) {
    case 2:
      return Ranks.TWO;
    case 3:
      return Ranks.THREE;
    case 4:
      return Ranks.FOUR;
    case 5:
      return Ranks.FIVE;
    case 6:
      return Ranks.SIX;
    case 7:
      return Ranks.SEVEN;
    case 8:
      return Ranks.EIGHT;
    case 9:
      return Ranks.NINE;
    case 10:
      // We could return `Ranks.JACK`, `Ranks.QUEEN` or `Ranks.KING` as well. We
      // arbitrarily choose `Ranks.TEN`.
      return Ranks.TEN;
    case 1:
    case 11:
      return Ranks.ACE;
  }
}

// TODO: Consolidate types so we can remove these converter functions?
export function cardRankToValue(cardRank: Ranks): dealerTotal {
  switch (cardRank) {
    case Ranks.TWO:
      return 2;
    case Ranks.THREE:
      return 3;
    case Ranks.FOUR:
      return 4;
    case Ranks.FIVE:
      return 5;
    case Ranks.SIX:
      return 6;
    case Ranks.SEVEN:
      return 7;
    case Ranks.EIGHT:
      return 8;
    case Ranks.NINE:
      return 9;
    case Ranks.TEN:
    case Ranks.KING:
    case Ranks.QUEEN:
    case Ranks.JACK:
      return 10;
    case Ranks.ACE:
      return 11;
  }
}

// TODO: Consolidate types so we can remove these converter functions?
export function correctMoveToAction(correctMove: correctMoves): actions {
  switch (correctMove) {
    case 'D':
      return 'double';
    case 'H':
      return 'hit';
    case 'N':
      return 'no-insurance';
    case 'Y':
      return 'ask-insurance';
    case 'P':
      return 'split';
    case 'R':
      return 'surrender';
    case 'S':
      return 'stand';
  }
}

// TODO: Consolidate types so we can remove these converter functions?
export function actionDataKeyToAction(actionDataKey: actionDataKeys): actions {
  switch (actionDataKey) {
    case 'd':
      return 'double';
    case 'h':
      return 'hit';
    case 'n':
      return 'no-insurance';
    case 'y':
      return 'ask-insurance';
    case 'p':
      return 'split';
    case 'r':
      return 'surrender';
    case 's':
      return 'stand';
  }
}

export type TableRules = {
  hitSoft17: boolean;
  allowLateSurrender: boolean;
  deckCount: deckCounts;
  maxHandsAllowed: number;
  maximumBet: number;
  minimumBet: number;
  playerCount: number;
};
