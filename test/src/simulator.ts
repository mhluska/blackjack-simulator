import * as chai from 'chai';

import Simulator from '../../src/simulator';

const expect = chai.expect;

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
      'timeElapsed'
    );
  });

  it('simulates with variable parameter', function () {
    const parameterName = 'playerBankroll';
    const parameterValues = [1000000, 2000000, 3000000];
    const results = simulator.simulateWithVariableParameter(parameterName, parameterValues);

    expect(results).to.have.keys(parameterValues.map(String));
    parameterValues.forEach((value) => {
      expect(results[value]).to.have.all.keys(
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
        'timeElapsed'
      );
    });
  });
});
