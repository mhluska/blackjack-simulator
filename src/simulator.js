import Game from './game.js';
import Utils from './utils.js';
import { PLAYER_STRATEGY } from './player.js';

const SETTINGS_DEFAULTS = {
  debug: false,
  playerStrategy: 'basic-strategy-i18',
  playerTablePosition: 2,
  playerBankroll: 10000 * 100,

  // TODO: DRY with Game.
  tableRules: {
    hitSoft17: true,
    allowLateSurrender: false,
    deckCount: 2,
    maxHandsAllowed: 4,
    maximumBet: 1000 * 100,
    minimumBet: 10 * 100,
    playerCount: 6,
  },
};

// TODO: Move to stats utils.
function sum(data) {
  return data.reduce((a, b) => a + b, 0);
}

// TODO: Move to stats utils.
function mean(data) {
  return sum(data) / data.length;
}

// TODO: Move to stats utils.
function variance(data) {
  const dataMean = mean(data);
  return sum(data.map((num) => (num - dataMean) ** 2)) / (data.length - 1);
}

export default class Simulator {
  constructor(settings = {}) {
    this.updateSettings(Utils.mergeDeep(SETTINGS_DEFAULTS, settings));
  }

  updateSettings(settings) {
    this.settings = Utils.mergeDeep({}, settings);
  }

  // TODO: Allow computing optimal bet spreads.
  // Simple bet spread strategy, for $10 minimum:
  // TC < 1: $10
  // TC 1: $10 * 2^0 = $10
  // TC 2: $10 * 2^1 = $20
  // TC 3: $10 * 2^2 = $40
  // TC 4: $10 * 2^3 = $80
  betAmount(hiLoTrueCount, minimumBet) {
    return hiLoTrueCount < 1
      ? minimumBet
      : minimumBet * 2 ** (Math.min(5, hiLoTrueCount) - 1);
  }

  async run({ hands = 10 ** 6 } = {}) {
    const startTime = Date.now();

    const game = new Game({
      debug: this.settings.debug,
      autoConfirmNewGame: true,
      animationDelay: 0,
      disableEvents: true,
      // TODO: Make this based on `playerStrategy`.
      playerStrategyOverride: {
        2: PLAYER_STRATEGY.BASIC_STRATEGY,
      },

      playerTablePosition: this.settings.playerTablePosition,
      playerBankroll: this.settings.playerBankroll,
      tableRules: this.settings.tableRules,
    });

    const bankroll = [game.player.balance];
    let handsWon = 0;
    let handsLost = 0;
    let handsPushed = 0;
    let handsPlayed = 0;
    let amountWagered = 0;

    while (handsPlayed < hands) {
      // const betAmount = this.betAmount(
      //   game.shoe.hiLoTrueCount,
      //   game.settings.tableRules.minimumBet
      // );

      const betAmount = game.settings.tableRules.minimumBet;

      await game.run({
        betAmount,
      });

      amountWagered += betAmount;
      bankroll.push(game.player.balance);

      for (let result of game.player.handWinner.values()) {
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
      houseEdge: -amountEarned / amountWagered,
      handsWon,
      handsLost,
      handsPushed,
      handsPlayed,
    };
  }
}
