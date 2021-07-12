import Simulator from '../simulator';

const minimumBet = 10 * 100;

// For 1% RoR, we use roughly 1000x the table minimum for the bankroll. And an
// extra 1000x for good measure since not counting yet (just basic strategy).
const playerBankroll = minimumBet * 1000 * 1000;

const simulator = new Simulator({
  debug: !!process.env.DEBUG,
  playerBankroll,
  tableRules: {
    minimumBet,
    maximumBet: minimumBet * 100,
    allowLateSurrender: true,
  },
});

async function run() {
  const hands = 10 ** 5;

  console.log(`Simulating Blackjack with ${hands} hands...`);

  const result = await simulator.run({ hands });

  console.log(result);
}

run();
