import { expect } from 'chai';

import Utils from '../../src/utils';
import { Comparator } from '../../src/types';

describe('Utils.compareRange', function () {
  it('returns true when number >= index for ">=" comparator', function () {
    const comparator: Comparator = '>=';
    expect(Utils.compareRange(5, [comparator, 3])).to.be.true;
    expect(Utils.compareRange(3, [comparator, 3])).to.be.true;
  });

  it('returns false when number < index for ">=" comparator', function () {
    const comparator: Comparator = '>=';
    expect(Utils.compareRange(2, [comparator, 3])).to.be.false;
  });

  it('returns true when number < index for "<" comparator', function () {
    const comparator: Comparator = '<';
    expect(Utils.compareRange(1, [comparator, 3])).to.be.true;
    expect(Utils.compareRange(-1, [comparator, 0])).to.be.true;
  });

  it('returns false when number >= index for "<" comparator', function () {
    const comparator: Comparator = '<';
    expect(Utils.compareRange(3, [comparator, 3])).to.be.false;
    expect(Utils.compareRange(4, [comparator, 3])).to.be.false;
  });

  it('handles fractional values correctly for "<" comparator', function () {
    const comparator: Comparator = '<';
    expect(Utils.compareRange(-0.5, [comparator, 0])).to.be.true;
    expect(Utils.compareRange(0.5, [comparator, 1])).to.be.true;
    expect(Utils.compareRange(-0.5, [comparator, -1])).to.be.false;
  });

  it('handles negative index values correctly', function () {
    const geComparator: Comparator = '>=';
    const ltComparator: Comparator = '<';
    expect(Utils.compareRange(-1, [geComparator, -2])).to.be.true;
    expect(Utils.compareRange(-3, [ltComparator, -2])).to.be.true;
    expect(Utils.compareRange(-3, [geComparator, -2])).to.be.false;
    expect(Utils.compareRange(-1, [ltComparator, -2])).to.be.false;
  });

  it('handles zero index values correctly', function () {
    const geComparator: Comparator = '>=';
    const ltComparator: Comparator = '<';
    expect(Utils.compareRange(0, [geComparator, 0])).to.be.true;
    expect(Utils.compareRange(-1, [ltComparator, 0])).to.be.true;
    expect(Utils.compareRange(0, [ltComparator, 0])).to.be.false;
    expect(Utils.compareRange(-1, [geComparator, 0])).to.be.false;
  });
});
