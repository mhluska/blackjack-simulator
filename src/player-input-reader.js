export default class PlayerInputReader {
  constructor(game) {
    this.game = game;
  }

  readInput({ keypress = () => {}, click = () => {} } = {}) {
    throw new Error('Implement this');
  }
}
