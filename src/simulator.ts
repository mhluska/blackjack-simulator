import Game, { GameSettings } from './game';
import Utils from './utils';
import { PlayerStrategy } from './player';
import { DeepPartial, TableRules } from './types';

export type SimulatorSettings = {
  debug: boolean;
  playerStrategy: 'basic-strategy' | 'basic-strategy-i18';
  playerBetSpread: number[];
  playerSpots: number[];
  playerTablePosition: number;
  playerBankroll: number;
  hands: number;
} & TableRules;

export type SimulatorResult = {
  amountEarned: string;
  amountWagered: string;
  bankrollRqd: string;
  betSpread: string;
  expectedValue: string;
  handsLost: string;
  handsPlayed: string;
  handsPushed: string;
  handsWon: string;
  houseEdge: string;
  penetration: string;
  spotsPlayed: string;
  stdDeviation: string;
  tableRules: string;
  timeElapsed: string;
};

function defaultSettings(minimumBet = 10 * 100): SimulatorSettings {
  const maxTrueCount = 5;

  return {
    // Simulator-only settings.
    hands: 10 ** 6,
    playerStrategy: 'basic-strategy',

    // TODO: Allow computing optimal bet spreads.
    // Simple bet spread strategy, for $10 minimum:
    // TC < 1: $10
    // TC 1: $10 * 2^0 = $10
    // TC 2: $10 * 2^1 = $20
    // TC 3: $10 * 2^2 = $40
    // TC 4: $10 * 2^3 = $80
    playerBetSpread: Array.from(
      { length: maxTrueCount },
      (item, hiLoTrueCount) => minimumBet * 2 ** hiLoTrueCount
    ),
    playerSpots: Array.from({ length: maxTrueCount }, () => 1),

    debug: false,
    playerTablePosition: 1,
    playerBankroll: minimumBet * 1000 * 1000,

    // Table rules
    allowDoubleAfterSplit: true,
    allowLateSurrender: false,
    blackjackPayout: '3:2',
    deckCount: 2,
    hitSoft17: true,
    maxHandsAllowed: 4,
    maximumBet: minimumBet * 100,
    minimumBet,
    playerCount: 1,
    penetration: 0.8,
  };
}

export const SETTINGS_DEFAULTS = defaultSettings();

// TODO: Move to stats utils.
function sum(data: number[]) {
  return data.reduce((a, b) => a + b, 0);
}

// TODO: Move to stats utils.
function mean(data: number[]) {
  return sum(data) / data.length;
}

// TODO: Move to stats utils.
function variance(data: number[]) {
  const dataMean = mean(data);
  return sum(data.map((num) => (num - dataMean) ** 2)) / (data.length - 1);
}

// Calculates bankroll required given a risk of ruin. Based on equation 9 in
// Sileo's paper: http://www12.plala.or.jp/doubledown/poker/sileo.pdf
function bankrollRequired(
  riskOfRuin: number,
  variancePerHand: number,
  expectationPerHand: number
) {
  return -(variancePerHand / (2 * expectationPerHand)) * Math.log(riskOfRuin);
}

function formatTableRules(settings: GameSettings) {
  return [
    `${Utils.formatCents(settings.minimumBet, {
      stripZeroCents: true,
    })}–${Utils.formatCents(settings.maximumBet, { stripZeroCents: true })}`,
    `${settings.deckCount}D`,
    settings.blackjackPayout,
    settings.hitSoft17 ? 'H17' : 'S17',
    settings.allowDoubleAfterSplit ? 'DAS' : null,
    settings.allowLateSurrender ? 'LS' : null,
    // TODO: Add a setting for resplit aces.
    'RSA',
  ]
    .filter(Boolean)
    .join(' ');
}

// Hands per hour estimation based on:
// https://wizardofodds.com/ask-the-wizard/136/
// TODO: Add consideration for pitch games.
// TODO: Add consideration for `spotCount`.
function estimateHandsPerHour(playerCount: number): number {
  switch (playerCount) {
    case 1:
      return 209;
    case 2:
      return 139;
    case 3:
      return 105;
    case 4:
      return 84;
    case 5:
      return 70;
    case 6:
      return 60;
    case 7:
      return 52;
  }

  // For weird cases like playerCount > 7 or < 1, we just return the midpoint
  // value to make TypeScript happy.
  // TODO: Convert playerCount to an enum and this can go away.
  return estimateHandsPerHour(4);
}

function parsePlayerStrategy(strategy: string): PlayerStrategy {
  switch (strategy) {
    case 'basic-strategy-i18':
      return PlayerStrategy.BASIC_STRATEGY_I18;
    default:
    case 'basic-strategy':
      return PlayerStrategy.BASIC_STRATEGY;
  }
}

export default class Simulator {
  settings: SimulatorSettings;
  playerStrategy: PlayerStrategy;

  constructor(settings: DeepPartial<SimulatorSettings>) {
    // TODO: Avoid `as` here. Otherwise returns `Partial<SimulatorSettings>`.
    this.settings = Utils.mergeDeep(
      defaultSettings(settings.minimumBet),
      settings
    ) as SimulatorSettings;

    this.playerStrategy = parsePlayerStrategy(this.settings.playerStrategy);
  }

  clampToArray(index: number, array: number[]): number {
    return array[Utils.clamp(Math.floor(index), 0, array.length - 1)];
  }

  betAmount(hiLoTrueCount: number): number {
    return this.clampToArray(hiLoTrueCount, this.settings.playerBetSpread);
  }

  spotCount(hiLoTrueCount: number): number {
    return this.clampToArray(hiLoTrueCount, this.settings.playerSpots);
  }

  run(): SimulatorResult {
    const startTime = Date.now();

    const game = new Game({
      ...this.settings,

      debug: this.settings.debug,
      disableEvents: true,
      playerStrategyOverride: {
        [this.settings.playerTablePosition]: this.playerStrategy,
      },
    });

    const bankrollStart = game.player.balance;

    let bankrollChangesMean = 0;
    let bankrollChangesVariance = 0;
    let bankrollValues = 1;

    let handsWon = 0;
    let handsLost = 0;
    let handsPushed = 0;
    let handsPlayed = 0;
    let amountWagered = 0;

    // TODO: Fix `handsPlayed` going slightly over the limit if the next
    // iteration involves playing more than one hand.
    while (handsPlayed < this.settings.hands) {
      const betAmount = this.betAmount(game.shoe.hiLoTrueCount);
      const spotCount = this.spotCount(game.shoe.hiLoTrueCount);

      const prevBalance = game.player.balance;

      game.run(betAmount, spotCount);

      // We calculate mean and variance from a stream of values since a large
      // dataset (100M+ hands) will not fit in memory.
      // See https://math.stackexchange.com/a/116344
      // TODO: Update this value per `handWinner`. Currently one change can
      // correspond to multiple hands due to splits.
      const bankrollChangeValue = game.player.balance - prevBalance;
      const prevBankrollChangesMean = bankrollChangesMean;
      bankrollValues += 1;
      bankrollChangesMean =
        bankrollChangesMean +
        (bankrollChangeValue - bankrollChangesMean) / bankrollValues;

      bankrollChangesVariance =
        bankrollChangesVariance +
        (bankrollChangeValue - prevBankrollChangesMean) *
          (bankrollChangeValue - bankrollChangesMean);

      for (const result of game.player.handWinner.values()) {
        handsPlayed += 1;
        amountWagered += betAmount;

        switch (result) {
          case 'player':
            handsWon += 1;
            break;
          case 'dealer':
            handsLost += 1;
            break;
          case 'push':
            handsPushed += 1;
            break;
        }
      }
    }

    bankrollChangesVariance /= bankrollValues - 1;

    const amountEarned = game.player.balance - bankrollStart;

    const handsPerHour = estimateHandsPerHour(this.settings.playerCount);
    const hoursPlayed = handsPlayed / handsPerHour;

    // TODO: Make RoR configurable.
    const riskOfRuin = 0.05;
    const formattedBankrollRequired = Utils.formatCents(
      bankrollRequired(
        riskOfRuin,
        bankrollChangesVariance,
        amountEarned / handsPlayed
      )
    );

    return {
      amountEarned: Utils.formatCents(amountEarned),
      amountWagered: Utils.formatCents(amountWagered),
      bankrollRqd: `${formattedBankrollRequired} (${Utils.formatPercent(
        riskOfRuin
      )} RoR)`,
      betSpread: Utils.arrayToRangeString(
        this.settings.playerBetSpread,
        (amount) => Utils.formatCents(amount, { stripZeroCents: true })
      ),
      expectedValue: `${Utils.formatCents(amountEarned / hoursPlayed)}/hour`,
      handsLost: Utils.abbreviateNumber(handsLost),
      handsPlayed: Utils.abbreviateNumber(handsPlayed),
      handsPushed: Utils.abbreviateNumber(handsPushed),
      handsWon: Utils.abbreviateNumber(handsWon),
      houseEdge: Utils.formatPercent(-amountEarned / amountWagered),
      penetration: Utils.formatPercent(this.settings.penetration),
      spotsPlayed: Utils.arrayToRangeString(this.settings.playerSpots),
      stdDeviation: Utils.formatCents(Math.sqrt(bankrollChangesVariance)),
      tableRules: formatTableRules(game.settings),
      timeElapsed: Utils.formatTime(Date.now() - startTime),
    };
  }
}
