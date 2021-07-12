import Game from './game';

import { actions, actionDataKeys } from './types';

export default interface PlayerInputReader {
  game: Game;
  readInput(handlers: {
    keypress: (action: actionDataKeys) => actions | void;
    click: (action: actionDataKeys) => actions | void;
  }): Promise<actions | void>;
}
