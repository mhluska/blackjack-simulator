import * as chai from 'chai';
import * as sinon from 'sinon';

import Card, { hiLoValue } from '../../src/card';
import Game from '../../src/game';
import { Rank, Suit, cardRankToValue } from '../../src/types';

const expect = chai.expect;

describe('cardRankToValue', function () {
  it('throws for invalid rank values', function () {
    const invalidRank = 999 as Rank;
    expect(() => cardRankToValue(invalidRank)).to.throw('Unexpected card rank');
  });
});

describe('hiLoValue', function () {
  it('throws for invalid rank values', function () {
    const invalidRank = 999 as Rank;
    expect(() => hiLoValue(invalidRank)).to.throw('Unexpected rank');
  });
});

describe('Card#flip', function () {
  it('calls shoe.emitChange() after updating the running count', function () {
    // Create a game to initialize the shoe and global settings.
    const game = new Game({ playerCount: 1, playerTablePosition: 1 });
    const shoe = game.shoe;

    // Draw a card face-down to simulate a dealer hole card.
    const card = shoe.drawCard({ showingFace: false });
    const countAfterDraw = shoe.hiLoRunningCount;

    // The face-down card should NOT be included in the running count.
    expect(card.showingFace).to.equal(false);

    const shoeEmitChangeSpy = sinon.spy(shoe, 'emitChange');
    const cardEmitChangeSpy = sinon.spy(card, 'emitChange');

    // Flip the card face-up (simulating dealer revealing hole card).
    card.flip();

    // The running count should now include the card's hi-lo value.
    expect(shoe.hiLoRunningCount).to.equal(countAfterDraw + card.hiLoValue);

    // shoe.emitChange() should have been called so the UI sees the updated count.
    expect(shoeEmitChangeSpy.callCount).to.equal(1);
    expect(cardEmitChangeSpy.callCount).to.equal(1);

    shoeEmitChangeSpy.restore();
    cardEmitChangeSpy.restore();
  });
});
