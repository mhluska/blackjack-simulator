import chai from 'chai';

import Simulator from '../src/simulator.js';

const expect = chai.expect;

describe('Simulator', function () {
  let simulator;

  before(function () {
    simulator = new Simulator({ debug: !!process.env.DEBUG });
  });

  describe('#run()', function () {
    it('runs', async function () {
      const result = await simulator.run({ hands: 10 ** 3 });

      expect(result).to.have.all.keys(
        'timeElapsed',
        'amountEarned',
        'amountEarnedVariance',
        'handsWon',
        'handsLost',
        'handsPushed'
      );
    });
  });
});
