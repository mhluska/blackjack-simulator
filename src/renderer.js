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

    process.stdout.write(text);
  }

  _renderPlayerLine(player, type, row) {
    const line = player.hands
      .map((hand) => {
        const padding = hand.cardTotal < 10 ? ' ' : '';
        const handFocus = this.game.state.focusedHand === hand ? '>' : ' ';

        return `${handFocus} (total ${
          hand.cardTotal
        }): ${padding}${this.cardRow(hand)}`;
      })
      .join('   ');

    this._renderLine(`${type} ${line}`, row);
  }
}

module.exports = {
  CLIRenderer: CLIRenderer,
};
