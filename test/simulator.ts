import * as chai from 'chai';

import Simulator from '../src/simulator';

const expect = chai.expect;

describe('Simulator', function () {
  let simulator: Simulator;

  before(function () {
    simulator = new Simulator({ debug: !!process.env.DEBUG, hands: 10 ** 3 });
  });

  describe('#run()', function () {
    it('runs', function () {
      const result = simulator.run();

      expect(result).to.have.all.keys(
        'amountEarned',
        'amountWagered',
        'expectedValue',
        'handsLost',
        'handsPlayed',
        'handsPushed',
        'handsWon',
        'houseEdge',
        'tableRules',
        'timeElapsed',
        'variance'
      );
    });
  });
});
