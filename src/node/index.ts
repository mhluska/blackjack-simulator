import CLIRenderer from '../cli-renderer';
import Game from '../game';
import FileStorage from '../file-storage';

const game = new Game();
const renderer = new CLIRenderer(game);
const storage = new FileStorage();

game.on('change', () => renderer.render());
game.on('create-record', storage.createRecord);

(async function () {
  while (true) {
    await game.run();
    renderer.render();
  }
})();
