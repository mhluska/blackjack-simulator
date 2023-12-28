import * as chai from 'chai';

import Hand from '../../src/hand';
import { Rank } from '../../src/types';

import { PlayerFactory, CardFactory } from '../factories';

const expect = chai.expect;

function setupHand(...cardRanks: Rank[]): Hand {
  return new Hand(
    PlayerFactory.build(),
    cardRanks.map((rank) => CardFactory.build({ rank }))
  );
}

function testCardTotals(ranks: Rank[], expectedTotals: number[]): Hand {
  const hand = setupHand();

  expect(hand.cardTotal).to.equal(0);

  for (let i = 0; i < ranks.length; i += 1) {
    hand.takeCard(CardFactory.build({ rank: ranks[i] }));
    expect(hand.cardTotal).to.equal(expectedTotals[i]);
  }

  for (let i = ranks.length - 1; i >= 0; i -= 1) {
    expect(hand.cardTotal).to.equal(expectedTotals[i]);
    hand.removeCard();
  }

  expect(hand.cardTotal).to.equal(0);

  for (let i = 0; i < ranks.length; i += 1) {
    hand.takeCard(CardFactory.build({ rank: ranks[i] }));
  }

  return hand;
}

describe('Hand', () => {
  describe('#blackjack', () => {
    it('should be true when the hand contains blackjack (J, A)', () => {
      const hand = setupHand(Rank.Jack, Rank.Ace);
      expect(hand.blackjack).to.be.true;
      expect(hand.cardHighTotal).to.equal(21);
    });
  });

  describe('#cardTotal', () => {
    it('should count correctly when the player is dealt 11 (7, 4)', () => {
      const hand = testCardTotals([Rank.Seven, Rank.Four], [7, 11]);
      expect(hand.isHard).to.be.true;
    });

    it('should count correctly when the player is dealt hard 21 (T, 9, 2)', () => {
      const hand = testCardTotals(
        [Rank.Ten, Rank.Nine, Rank.Two],
        [10, 19, 21]
      );
      expect(hand.isHard).to.be.true;
    });

    it('should count correctly when the player is dealt soft 21 (3, A, A, 3, 3)', () => {
      const hand = testCardTotals(
        [Rank.Three, Rank.Ace, Rank.Ace, Rank.Three, Rank.Three],
        [3, 14, 15, 18, 21]
      );
      expect(hand.isSoft).to.be.true;
    });

    it('should count correctly when the player is dealt 21 with all aces', () => {
      const hand = testCardTotals(
        Array.from({ length: 21 }, () => Rank.Ace),
        [
          11,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
          12,
          13,
          14,
          15,
          16,
          17,
          18,
          19,
          20,
          21,
        ]
      );
      expect(hand.isHard).to.be.true;
    });
  });
});
