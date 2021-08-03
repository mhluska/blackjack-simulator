const MINIMUM_BET = 10 * 100;

export const settings = {
  animationDelay: 0,
  autoDeclineInsurance: true,
  disableEvents: true,
  checkDeviations: false,
  checkTopNDeviations: 18,
  mode: 'default',
  debug: false,
  playerBankroll: MINIMUM_BET * 1000,
  playerTablePosition: 1,
  playerStrategyOverride: {},

  allowDoubleAfterSplit: true,
  allowLateSurrender: true,
  blackjackPayout: '3:2',
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: MINIMUM_BET * 100,
  minimumBet: MINIMUM_BET,
  playerCount: 1,
} as const;
