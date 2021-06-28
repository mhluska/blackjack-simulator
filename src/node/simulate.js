import Simulator from '../simulator.js';

const tableMinimum = 10 * 100;

// For 1% RoR, we use roughly 1000x the table minimum for the bankroll. And an
// extra 1000x for good measure since not counting yet (just basic strategy).
const playerBankroll = tableMinimum * 1000 * 1000;

const simulator = new Simulator({
  debug: !!process.env.DEBUG,
  playerBankroll,
  tableRules: {
    tableMinimum,
    tableMaximum: tableMinimum * 100,
    allowLateSurrender: true,
  },
});

async function run() {
  const result = await simulator.run({ hands: 10 ** 5 });
  console.log(result);
}

run();
