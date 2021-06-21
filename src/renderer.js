import assert from 'assert';

export default class Renderer {
  constructor(game) {
    assert(game, 'Need to initialize Renderer with game');
    this.game = game;
  }

  render() {
    throw new Error('Implement this');
  }
}
