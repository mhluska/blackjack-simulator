import { BlackjackPayout } from '../src/types';

const MINIMUM_BET = 10 * 100;

export const settings = {
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
  allowLateSurrender: false,
  allowResplitAces: false,
  blackjackPayout: BlackjackPayout.ThreeToTwo,
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: MINIMUM_BET * 100,
  minimumBet: MINIMUM_BET,
  playerCount: 1,
  penetration: 0.75,
} as const;
