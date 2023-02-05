import * as readline from 'readline';

import Renderer from './renderer';
import Game, { settings as gameSettings } from './game';
import Player from './player';
import Hand from './hand';
import { HandWinner, GameStep, handWinnerToString } from './types';

const PLAY_CORRECTION_VISIBLE_TIME_MS = 4000;

// Renders the game state to the terminal.
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

  get outputLines(): string[] {
    return [
      this._playerLine(this.game.dealer, HandWinner.Dealer),
      this._playerLine(this.game.player, HandWinner.Player),
      this._statsLine(),
      this._questionLine(),
    ];
  }

  render(): void {
    const lines = this.outputLines;

    if (this.game.state.playCorrection) {
      lines[2] = this.game.state.playCorrection;

      setTimeout(() => {
        this._renderLines(this.outputLines);
      }, PLAY_CORRECTION_VISIBLE_TIME_MS);
    }

    this._renderLines(lines);
  }

  _renderLines(lines: string[]): void {
    lines.forEach((line, i) => {
      this._renderLine(line, lines.length - i - 1);
    });
  }

  _setupCliInput(): void {
    // Allows collecting keypress events in `getPlayerMoveInput`.
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  _playerLine(player: Player, type: HandWinner): string {
    const line = player.hands
      .map((hand) => {
        const padding = hand.cardTotal < 10 ? ' ' : '';
        const handFocus = this.game.focusedHand === hand ? '>' : ' ';

        return `${handFocus} (total ${
          hand.cardTotal
        }): ${padding}${this._colorizeHand(hand.serialize())}`;
      })
      .join('   ');

    return `${handWinnerToString(type)} ${line}`;
  }

  _statsLine(): string {
    return `TC: ${this.game.shoe.hiLoTrueCount.toFixed(2)}`;
  }

  _questionLine(): string {
    if (!this.game.state.step || !this.game.focusedHand) {
      return '';
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

    return question ?? '';
  }

  _renderLine(text: string, yPosBottom = 0): void {
    if (text == null) {
      return;
    }

    readline.cursorTo(process.stdout, 0, process.stdout.rows - yPosBottom - 1);
    readline.clearLine(process.stdout, 0);

    process.stdout.write(text);
  }

  // Alters the text with ANSI escape codes. For example, bold ace cards.
  _colorizeHand(serializedHand: string): string {
    const boldEscape = '\u001b[1m';
    const resetEscape = '\u001b[0m';

    return serializedHand.replace(/A/g, `${boldEscape}A${resetEscape}`);
  }
}
