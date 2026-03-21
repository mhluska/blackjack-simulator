import * as chai from 'chai';
import * as sinon from 'sinon';

import { hiLoValue } from '../../src/card';
import Game from '../../src/game';
import { Rank, cardRankToValue } from '../../src/types';

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
    const game = new Game({ playerCount: 1, playerTablePosition: 1 });
    const shoe = game.shoe;

    const card = shoe.drawCard({ showingFace: false });
    const countAfterDraw = shoe.hiLoRunningCount;

    expect(card.showingFace).to.equal(false);

    const shoeEmitSpy = sinon.spy(shoe, 'emitChange');
    const cardEmitSpy = sinon.spy(card, 'emitChange');

    card.flip();

    expect(shoe.hiLoRunningCount).to.equal(countAfterDraw + card.hiLoValue);
    expect(shoeEmitSpy.callCount).to.equal(1);
    expect(cardEmitSpy.callCount).to.equal(1);

    shoeEmitSpy.restore();
    cardEmitSpy.restore();
  });
});
