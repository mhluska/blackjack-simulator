import readline from 'readline';
import Renderer from './renderer.js';

// Renders the game state to the terminal.
// TODO: Make this draw ascii-based cards. For now just basic text output.
export default class CLIRenderer extends Renderer {
  constructor(game) {
    super(game);

    this._setupCliInput();

    // Creates space for further output during rendering.
    console.log();
    console.log();
    console.log();
  }

  render() {
    this._renderDealerCards();
    this._renderPlayerCards();
    this._renderPlayCorrection();
    this._renderQuestion();
  }

  _setupCliInput() {
    // Allows collecting keypress events in `getPlayerMoveInput`.
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  _renderDealerCards() {
    this._renderPlayerLine(this.game.dealer, 'Dealer', 3);
  }

  _renderPlayerCards() {
    this._renderPlayerLine(this.game.player, 'Player', 2);
  }

  _renderPlayCorrection() {
    this._renderLine(this.game.state.playCorrection, 1);
  }

  _renderQuestion() {
    let question;

    if (this.game.state.step === 'waiting-for-move') {
      question = 'H (hit), S (stand), D (double), R (surrender)';

      if (this.game.state.focusedHand?.hasPairs) {
        question += ', P (split)';
      }

      question += '? ';
    } else {
      const getGameResult = (hand) => {
        const blackjack = hand.blackjack ? 'Blackjack! ' : '';

        switch (this.game.state.handWinner[hand.id]) {
          case 'player':
            return `${blackjack}Player wins`;
          case 'dealer':
            return `${blackjack}Dealer wins`;
          case 'push':
            return 'Push';
        }
      };

      // TODO: Align these results with the hands above.
      const result = this.game.player.hands
        .map((hand) => getGameResult(hand))
        .join(', ');

      question = `${result} (press any key for next hand)`;
    }

    this._renderLine(question, 0);
  }

  _renderLine(text, yPosBottom = 0) {
    if (text == null) {
      return;
    }

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
        }): ${padding}${this._colorizeHand(hand.serialize())}`;
      })
      .join('   ');

    this._renderLine(`${type} ${line}`, row);
  }

  // Alters the text with ANSI escape codes. For example, bold ace cards.
  _colorizeHand(serializedHand) {
    const boldEscape = '\u001b[1m';
    const resetEscape = '\u001b[0m';

    return serializedHand.replace(/A/g, `${boldEscape}A${resetEscape}`);
  }
}
