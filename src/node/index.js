import Renderer from 'renderer';
import Game from '../game.js';
import FileStorage from '../file-storage.js';

const game = new Game();
const renderer = new Renderer(game);
game.on('change', () => renderer.render());
game.on('create-record', FileStorage.createRecord);

(async function () {
  while (true) {
    await game.start();
    renderer.render();
  }
})();
