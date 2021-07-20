import Game, { GameSettings } from './game';
import Utils from './utils';
import { PlayerStrategy } from './player';
import { DeepPartial, TableRules } from './types';

export type SimulatorSettings = {
  debug: boolean;
  playerStrategy: 'basic-strategy' | 'basic-strategy-i18';
  playerTablePosition: number;
  playerBankroll: number;
  hands: number;
} & TableRules;

export type SimulatorResult = {
  amountEarned: string;
  amountWagered: string;
  expectedValue: string;
  handsLost: string;
  handsPlayed: string;
  handsPushed: string;
  handsWon: string;
  houseEdge: string;
  tableRules: string;
  timeElapsed: string;
  variance: string;
};

const minimumBet = 10 * 100;

export const SETTINGS_DEFAULTS: SimulatorSettings = {
  // Simulator-only settings.
  hands: 10 ** 5,
  playerStrategy: 'basic-strategy',

  debug: false,
  playerTablePosition: 1,
  playerBankroll: minimumBet * 1000 * 1000,

  // Table rules
  allowDoubleAfterSplit: true,
  allowLateSurrender: true,
  blackjackPayout: '3:2',
  deckCount: 2,
  hitSoft17: true,
  maxHandsAllowed: 4,
  maximumBet: 1000 * 100,
  minimumBet,
  playerCount: 6,
};

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
  ].join(' ');
}

export default class Simulator {
  settings: SimulatorSettings;

  constructor(settings: DeepPartial<SimulatorSettings>) {
    // TODO: Avoid `as` here. Otherwise returns `Partial<SimulatorSettings>`.
    this.settings = Utils.mergeDeep(
      SETTINGS_DEFAULTS,
      settings
    ) as SimulatorSettings;
  }

  // TODO: Allow computing optimal bet spreads.
  // Simple bet spread strategy, for $10 minimum:
  // TC < 1: $10
  // TC 1: $10 * 2^0 = $10
  // TC 2: $10 * 2^1 = $20
  // TC 3: $10 * 2^2 = $40
  // TC 4: $10 * 2^3 = $80
  betAmount(hiLoTrueCount: number, minimumBet: number): number {
    return hiLoTrueCount < 1
      ? minimumBet
      : minimumBet * 2 ** (Math.min(5, hiLoTrueCount) - 1);
  }

  async run(): Promise<SimulatorResult> {
    const startTime = Date.now();

    const game = new Game({
      ...this.settings,

      debug: this.settings.debug,
      autoConfirmNewGame: true,
      animationDelay: 0,
      disableEvents: true,
      playerStrategyOverride: {
        [this.settings.playerTablePosition]:
          this.settings.playerStrategy === 'basic-strategy'
            ? PlayerStrategy.BASIC_STRATEGY
            : PlayerStrategy.BASIC_STRATEGY_I18,
      },
    });

    const bankroll = [game.player.balance];
    let handsWon = 0;
    let handsLost = 0;
    let handsPushed = 0;
    let handsPlayed = 0;
    let amountWagered = 0;

    while (handsPlayed < this.settings.hands) {
      // const betAmount = this.betAmount(
      //   game.shoe.hiLoTrueCount,
      //   game.settings.minimumBet
      // );

      const betAmount = game.settings.minimumBet;

      await game.run({
        betAmount,
      });

      bankroll.push(game.player.balance);

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

    const amountEarned = bankroll[bankroll.length - 1] - bankroll[0];

    // TODO: Estimate this based on number of players at the table.
    const handsPerHour = 50;
    const hoursPlayed = handsPlayed / handsPerHour;

    return {
      amountEarned: Utils.formatCents(amountEarned),
      amountWagered: Utils.formatCents(amountWagered),
      expectedValue: `${Utils.formatCents(amountEarned / hoursPlayed)}/hour`,
      handsLost: Utils.abbreviateNumber(handsLost),
      handsPlayed: Utils.abbreviateNumber(handsPlayed),
      handsPushed: Utils.abbreviateNumber(handsPushed),
      handsWon: Utils.abbreviateNumber(handsWon),
      houseEdge: `${((-amountEarned / amountWagered) * 100).toFixed(2)}%`,
      tableRules: formatTableRules(game.settings),
      timeElapsed: Utils.formatTime(Date.now() - startTime),
      variance: Utils.formatCents(variance(bankroll)),
    };
  }
}
