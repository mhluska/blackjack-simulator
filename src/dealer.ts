import Player from './player';
import Card from './card';

export default class Dealer extends Player {
  static entityName = 'dealer';

  get upcard(): Card {
    return this.cards[1];
  }

  get holeCard(): Card {
    return this.cards[0];
  }
}
