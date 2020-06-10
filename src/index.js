const { CLIRenderer } = require('./renderer');
const Game = require('./game');

const game = new Game();
const renderer = new CLIRenderer(game);
game.on('change', () => renderer.render());
game.start();
renderer.render();
