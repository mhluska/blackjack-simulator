import Player from './player';
import Card from './card';

export default class Dealer extends Player {
  static entityName = 'dealer';

  get upcard(): Card | void {
    return this.cards.find((card) => card.visible);
  }

  get holeCard(): Card | void {
    return this.cards.find((card) => !card.visible);
  }
}
