const { CLIRenderer } = require('./renderer');
const Game = require('./game');

const game = new Game();
const renderer = new CLIRenderer(game);
game.on('change', () => renderer.render());

(async function () {
  while (true) {
    await game.start();
    renderer.render();
  }
})();
