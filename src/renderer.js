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
    this.renderWinner();
    this.renderQuestion();
  }

  renderDealerCards() {
    const cardRow = this.game.dealer.cards
      .map((card) => (card.visible ? card.rank : '?'))
      .join(' ');
    this._renderLine(`Dealer: ${cardRow}`, 2);
  }

  renderPlayerCards() {
    const cardRow = this.game.player.cards
      .map((card) => (card.visible ? card.rank : '?'))
      .join(' ');
    this._renderLine(`Player: ${cardRow}`, 1);
  }

  renderWinner() {
    if (!this.game.winner) {
      return;
    }

    if (this.game.winner === 'player') {
      this._renderLine('Player wins');
    } else {
      this._renderLine('Dealer wins');
    }
  }

  renderQuestion() {
    if (!this.game.question) {
      return;
    }

    this._renderLine(this.game.question, 0);
  }

  _renderLine(text, yPosBottom = 0) {
    readline.cursorTo(process.stdout, 0, process.stdout.rows - yPosBottom - 1);
    this.cli.write(text);
  }
}

module.exports = {
  CLIRenderer: CLIRenderer,
};
