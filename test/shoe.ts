import * as chai from 'chai';

import Shoe from '../src/shoe';
import Card from '../src/card';
import { Suit, Rank } from '../src/types';

import { settings } from './mocks';

const expect = chai.expect;

describe('Shoe', function () {
  let shoe: Shoe;
  let cards: Card[];

  beforeEach(function () {
    shoe = new Shoe({ settings });
    cards = [
      new Card(Suit.Hearts, Rank.Ace, shoe),
      new Card(Suit.Diamonds, Rank.Ace, shoe),
      new Card(Suit.Clubs, Rank.Ace, shoe),
      new Card(Suit.Spades, Rank.Ace, shoe),
    ];
    shoe.setCards(cards);
  });

  it('adds and draws cards', function () {
    shoe.drawCard();

    const card = shoe.drawCard();
    expect(card?.suit).equals(Suit.Clubs);
  });

  it('gets shoe attributes', function () {
    const attributes = shoe.attributes();
    expect(attributes.cards.length).equals(cards.length);
  });
});
