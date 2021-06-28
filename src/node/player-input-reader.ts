import PlayerInputReader from '../player-input-reader';
import Game from '../game';
import { actions } from '../types';

export default class CLIPlayerInputReader implements PlayerInputReader {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  readInput({
    keypress = (): actions | void => {
      // lol
    },
  }: { keypress: (action: string) => actions | void, click: (action: string) => actions | void }): Promise<actions | void> {
    return new Promise((resolve) => {
      process.stdin.once('keypress', (str, key) => {
        if (key && key.ctrl && key.name === 'c') {
          process.stdin.pause();
          return;
        }

        resolve(keypress(str));
      });
    });
  }
}
