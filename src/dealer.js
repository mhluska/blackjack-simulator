import Player from './player.js';

export default class Dealer extends Player {
  get upcard() {
    return this.cards.find((card) => card.visible);
  }

  get holeCard() {
    return this.cards.find((card) => !card.visible);
  }
}
