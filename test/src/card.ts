import * as chai from 'chai';

import { hiLoValue } from '../../src/card';
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
