import GameObject from './game-object';
import Card, { CardAttributes } from './card';

export type DiscardTrayAttributes = {
  cards: CardAttributes[];
};

export default class DiscardTray extends GameObject {
  static entityName = 'discardTray';

  cards: Card[];

  constructor() {
    super();
    this.cards = [];
  }

  addCard(card: Card): void {
    if (card.showingFace) {
      card.showingFace = false;
    }

    this.cards.push(card);
    this.emitChange();
  }

  addCards(cards: Card[]): void {
    cards.forEach((card) => this.addCard(card));
  }

  removeCards(): Card[] {
    const cards = this.cards.slice();
    this.cards = [];
    this.emitChange();
    return cards;
  }

  attributes(): DiscardTrayAttributes {
    return {
      cards: this.cards.map((card) => card.attributes()),
    };
  }
}
