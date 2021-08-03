import * as chai from 'chai';

import Shoe from '../src/shoe';
import Card from '../src/card';
import { Suits, Ranks } from '../src/types';

import { settings } from './mocks';

const expect = chai.expect;

describe('Shoe', function () {
  let shoe: Shoe;
  let cards: Card[];

  beforeEach(function () {
    shoe = new Shoe({ settings });
    cards = [
      new Card(Suits.HEARTS, Ranks.ACE, shoe),
      new Card(Suits.DIAMONDS, Ranks.ACE, shoe),
      new Card(Suits.CLUBS, Ranks.ACE, shoe),
      new Card(Suits.SPADES, Ranks.ACE, shoe),
    ];
    shoe.setCards(cards);
  });

  it('adds and draws cards', function () {
    shoe.drawCard();

    const card = shoe.drawCard();
    expect(card?.suit).equals(Suits.CLUBS);
  });

  it('gets shoe attributes', function () {
    const attributes = shoe.attributes();
    expect(attributes.cards.length).equals(cards.length);
  });
});
