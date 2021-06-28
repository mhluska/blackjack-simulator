import Game from './game';

export default interface Renderer {
  game: Game;
  render(): void;
}
