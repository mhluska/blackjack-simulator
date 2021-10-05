import * as readline from 'readline';

import Renderer from './renderer';
import Game, { settings as gameSettings } from './game';
import Player from './player';
import Hand from './hand';
import { HandWinner, GameStep, handWinnerToString } from './types';

// Renders the game state to the terminal.
// TODO: Make this draw ascii-based cards. For now just basic text output.
export default class CLIRenderer implements Renderer {
  game: Game;

  constructor(game: Game) {
    this.game = game;

    this._setupCliInput();

    // Creates space for further output during rendering.
    console.log();
    console.log();
    console.log();
  }

  render(): void {
    this._renderDealerCards();
    this._renderPlayerCards();
    this._renderPlayCorrection();
    this._renderQuestion();
  }

  _setupCliInput(): void {
    // Allows collecting keypress events in `getPlayerMoveInput`.
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  _renderDealerCards(): void {
    this._renderPlayerLine(this.game.dealer, HandWinner.Dealer, 3);
  }

  _renderPlayerCards(): void {
    this._renderPlayerLine(this.game.player, HandWinner.Player, 2);
  }

  _renderPlayCorrection(): void {
    this._renderLine(this.game.state.playCorrection, 1);
  }

  _renderQuestion(): void {
    if (!this.game.state.step || !this.game.focusedHand) {
      return;
    }

    let question;

    if (this.game.state.step === GameStep.WaitingForPlayInput) {
      const choices = ['H (hit)', 'S (stand)'];

      if (this.game.focusedHand.firstMove) {
        choices.push('D (double)');

        if (gameSettings.allowLateSurrender) {
          choices.push('R (surrender)');
        }
      }

      if (this.game.focusedHand.allowSplit) {
        choices.push('P (split)');
      }

      question = choices.join(', ') + '? ';
    } else if (this.game.state.step === GameStep.WaitingForInsuranceInput) {
      question = 'Y (buy insurance), N (no insurance)? ';
    } else if (this.game.state.step === GameStep.WaitingForNewGameInput) {
      const getGameResult = (hand: Hand) => {
        const blackjack =
          hand.blackjack && !this.game.dealer.blackjack ? 'Blackjack! ' : '';

        switch (this.game.player.handWinner.get(hand.id)) {
          case HandWinner.Player:
            return `${blackjack}Player wins`;
          case HandWinner.Dealer:
            return `${blackjack}Dealer wins`;
          case HandWinner.Push:
            return HandWinner.Push;
        }
      };

      // TODO: Align these results with the hands above.
      const result = this.game.player.hands
        .map((hand) => getGameResult(hand))
        .join(', ');

      question = `${result} (press any key for next hand)`;
    }

    if (question) {
      this._renderLine(question);
    }
  }

  _renderLine(text: string, yPosBottom = 0): void {
    if (text == null) {
      return;
    }

    readline.cursorTo(process.stdout, 0, process.stdout.rows - yPosBottom - 1);
    readline.clearLine(process.stdout, 0);

    process.stdout.write(text);
  }

  _renderPlayerLine(player: Player, type: HandWinner, row: number): void {
    const line = player.hands
      .map((hand) => {
        const padding = hand.cardTotal < 10 ? ' ' : '';
        const handFocus = this.game.focusedHand === hand ? '>' : ' ';

        return `${handFocus} (total ${
          hand.cardTotal
        }): ${padding}${this._colorizeHand(hand.serialize())}`;
      })
      .join('   ');

    this._renderLine(`${handWinnerToString(type)} ${line}`, row);
  }

  // Alters the text with ANSI escape codes. For example, bold ace cards.
  _colorizeHand(serializedHand: string): string {
    const boldEscape = '\u001b[1m';
    const resetEscape = '\u001b[0m';

    return serializedHand.replace(/A/g, `${boldEscape}A${resetEscape}`);
  }
}
