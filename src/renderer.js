const assert = require('assert');
const readline = require('readline');

class Renderer {
  constructor(game) {
    assert(game, 'Need to initialize Renderer with game');

    this.game = game;
  }

  render() {
    throw new Error('Implement this');
  }
}

// Renders the game state to the terminal.
// TODO: Make this draw ascii-based cards. For now just basic text output.
class CLIRenderer extends Renderer {
  constructor(game) {
    super(game);

    this.cli = readline.createInterface(process.stdin, process.stdout);

    // Creates space for further output during rendering.
    console.log();
    console.log();
  }

  render() {
    this.renderDealerCards();
    this.renderPlayerCards();
    this.renderQuestion();
  }

  cardRow(player) {
    return player.cards
      .map((card) => (card.visible ? card.rank : '?'))
      .join(' ');
  }

  renderDealerCards() {
    this._renderPlayerLine(this.game.dealer, 'Dealer', 2);
  }

  renderPlayerCards() {
    this._renderPlayerLine(this.game.player, 'Player', 1);
  }

  renderQuestion() {
    if (!this.game.state.question) {
      return;
    }

    this._renderLine(this.game.state.question, 0);
  }

  _renderLine(text, yPosBottom = 0) {
    readline.cursorTo(process.stdout, 0, process.stdout.rows - yPosBottom - 1);
    readline.clearLine(process.stdout, 0);

    this.cli.write(text);
  }

  _renderPlayerLine(player, type, row) {
    const padding = player.cardTotal < 10 ? ' ' : '';

    this._renderLine(
      `${type} (total ${player.cardTotal}): ${padding}${this.cardRow(player)}`,
      row
    );
  }
}

module.exports = {
  CLIRenderer: CLIRenderer,
};
