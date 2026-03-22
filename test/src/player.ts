import { expect } from 'chai';

import Player from '../../src/player';
import { PlayerStrategy } from '../../src/types';

describe('Player', () => {
  describe('#useChips()', () => {
    it('should throw when betAmount exceeds balance even if hand.betAmount is smaller', () => {
      const player = new Player({
        balance: 8,
        handsMax: 1,
        strategy: PlayerStrategy.BasicStrategy,
      });

      // Add a hand with a small initial bet of 5.
      player.addHand(5);

      const hand = player.firstHand;

      // hand.betAmount is now 5, balance is 3.
      // Attempting to bet 10 more should fail since balance (3) < betAmount (10).
      // Bug: the check uses hand.betAmount (5) instead of betAmount (10),
      // so it incorrectly compares 3 < 5 which throws, but for the wrong reason.
      // To isolate the bug, set balance so that balance < betAmount but
      // balance >= hand.betAmount.
      player.balance = 8;
      hand.betAmount = 5;

      // balance=8, hand.betAmount=5, betAmount=10
      // Bug check: 8 < 5 => false (no throw, balance goes negative)
      // Fixed check: 8 < 10 => true (throws correctly)
      expect(() => player.useChips(10, { hand })).to.throw(
        'Insufficient player balance',
      );
    });

    it('should allow bet when balance is sufficient', () => {
      const player = new Player({
        balance: 100,
        handsMax: 1,
        strategy: PlayerStrategy.BasicStrategy,
      });

      player.addHand(10);

      const hand = player.firstHand;

      // balance is now 90, bet another 10 which should succeed.
      expect(() => player.useChips(10, { hand })).to.not.throw();
      expect(player.balance).to.equal(80);
      expect(hand.betAmount).to.equal(20);
    });
  });
});
