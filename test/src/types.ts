import * as chai from 'chai';

import { GameMode, parseGameMode } from '../../src/types';

const expect = chai.expect;

describe('parseGameMode', function () {
  it('returns GameMode.Default for "default"', function () {
    expect(parseGameMode('default')).to.equal(GameMode.Default);
  });

  it('returns GameMode.Pairs for "pairs"', function () {
    expect(parseGameMode('pairs')).to.equal(GameMode.Pairs);
  });

  it('returns GameMode.Uncommon for "uncommon"', function () {
    expect(parseGameMode('uncommon')).to.equal(GameMode.Uncommon);
  });

  it('returns GameMode.Deviations for "deviations"', function () {
    expect(parseGameMode('deviations')).to.equal(GameMode.Deviations);
  });

  it('returns undefined for undefined input', function () {
    expect(parseGameMode(undefined)).to.be.undefined;
  });

  it('throws for unknown game mode', function () {
    expect(() => parseGameMode('invalid')).to.throw('Unexpected game mode');
  });
});
