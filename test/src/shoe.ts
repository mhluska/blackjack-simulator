import * as chai from 'chai';

import Shoe from '../../src/shoe';
import Card from '../../src/card';

import { CardFactory } from '../factories';

const expect = chai.expect;

describe('Shoe', function () {
  let shoe: Shoe;
  let cards: Card[];

  beforeEach(function () {
    shoe = new Shoe();
    cards = [
      CardFactory.build(),
      CardFactory.build(),
      CardFactory.build(),
      CardFactory.build(),
    ];
    shoe.setCards(cards);
  });

  it('adds and draws cards', function () {
    expect(shoe.drawCard()).equals(cards[3]);
    expect(shoe.drawCard()).equals(cards[2]);
    expect(shoe.drawCard()).equals(cards[1]);
    expect(shoe.drawCard()).equals(cards[0]);
  });

  it('gets shoe attributes', function () {
    const attributes = shoe.attributes();
    expect(attributes.cards.length).equals(cards.length);
  });
});
