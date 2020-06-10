export default class Renderer {
  constructor(game) {
    console.assert(game, 'Need to initialize Renderer with game');
    this.game = game;
  }

  render() {
    throw new Error('Implement this');
  }
}
