import { expect } from 'chai';

import Simulator from '../../src/simulator';

describe('Simulator', function () {
  let simulator: Simulator;

  before(function () {
    simulator = new Simulator({ debug: !!process.env.DEBUG, hands: 10 ** 3 });
  });

  it('runs', function () {
    const result = simulator.run();

    expect(result).to.have.all.keys(
      'amountEarned',
      'amountWagered',
      'bankrollMean',
      'bankrollVariance',
      'handsLost',
      'handsPlayed',
      'handsPushed',
      'handsWon',
      'hoursPlayed',
      'riskOfRuin',
      'timeElapsed',
    );
  });

  it('computes bankrollVariance correctly for known inputs', function () {
    // Run a short simulation and verify the variance matches a naive calculation.
    const sim = new Simulator({
      debug: !!process.env.DEBUG,
      hands: 100,
      // Flat bet, single spot, no spread — simplest case.
      playerBetSpread: [10 * 100],
      playerSpots: [1],
    });

    // Monkey-patch to record per-round bankroll changes.
    const changes: number[] = [];
    const origRun = sim.game.run.bind(sim.game);
    sim.game.run = (betAmount: number, spotCount: number) => {
      const before = sim.game.player.balance;
      origRun(betAmount, spotCount);
      changes.push(sim.game.player.balance - before);
    };

    const result = sim.run();

    // Compute expected variance from recorded changes using the standard formula.
    const n = changes.length;
    const mean = changes.reduce((a, b) => a + b, 0) / n;
    const expectedVariance =
      changes.reduce((sum, x) => sum + (x - mean) ** 2, 0) / (n - 1);

    // The simulator's bankrollVariance should match.
    expect(result.bankrollVariance).to.be.closeTo(expectedVariance, 1);
  });
});
