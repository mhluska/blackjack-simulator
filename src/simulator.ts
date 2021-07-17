import Game from './game';
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

type SimuatorResult = {
  timeElapsed: number;
  amountWagered: string;
  amountEarned: string;
  amountEarnedVariance: string;
  houseEdge: string;
  handsWon: number;
  handsLost: number;
  handsPushed: number;
  handsPlayed: number;
};

const minimumBet = 10 * 100;

export const SETTINGS_DEFAULTS: SimulatorSettings = {
  debug: false,
  playerStrategy: 'basic-strategy-i18',
  playerTablePosition: 2,
  playerBankroll: minimumBet * 1000 * 1000,
  hands: 10 ** 5,

  // Table rules
  hitSoft17: true,
  allowLateSurrender: true,
  deckCount: 2,
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

  async run(): Promise<SimuatorResult> {
    const startTime = Date.now();

    const game = new Game({
      debug: this.settings.debug,
      autoConfirmNewGame: true,
      animationDelay: 0,
      disableEvents: true,
      // TODO: Make this based on `playerStrategy`.
      playerStrategyOverride: {
        2: PlayerStrategy.BASIC_STRATEGY,
      },

      playerTablePosition: this.settings.playerTablePosition,
      playerBankroll: this.settings.playerBankroll,

      hitSoft17: this.settings.hitSoft17,
      allowLateSurrender: this.settings.allowLateSurrender,
      deckCount: this.settings.deckCount,
      maxHandsAllowed: this.settings.maxHandsAllowed,
      maximumBet: this.settings.maximumBet,
      minimumBet: this.settings.minimumBet,
      playerCount: this.settings.playerCount,
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
      //   game.settings.tableRules.minimumBet
      // );

      const betAmount = game.settings.minimumBet;

      await game.run({
        betAmount,
      });

      amountWagered += betAmount;
      bankroll.push(game.player.balance);

      for (const result of game.player.handWinner.values()) {
        handsPlayed += 1;

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

    return {
      timeElapsed: Date.now() - startTime,
      amountWagered: Utils.formatCents(amountWagered),
      amountEarned: Utils.formatCents(amountEarned),
      amountEarnedVariance: Utils.formatCents(variance(bankroll)),
      houseEdge: `${((-amountEarned / amountWagered) * 100).toFixed(2)}%`,
      handsWon,
      handsLost,
      handsPushed,
      handsPlayed,
    };
  }
}
