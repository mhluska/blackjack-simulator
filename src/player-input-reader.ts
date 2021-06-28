import Game from './game';

import { actions } from './types';

export default interface PlayerInputReader {
  game: Game;
  readInput(handlers: {
    keypress: (action: string) => actions | void;
    click: (action: string) => actions | void;
  }): Promise<actions | void>;
}
