import Renderer from 'renderer';
import Game from './game.js';

const game = new Game();
const renderer = new Renderer(game);
game.on('change', () => renderer.render());

(async function () {
  while (true) {
    await game.start();
    renderer.render();
  }
})();
