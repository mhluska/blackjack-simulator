import Game from '../game';
import PlayerInputReader from '../player-input-reader';
import { actionDataKeys, actions } from '../types';

export default class DOMPlayerInputReader implements PlayerInputReader {
  game: Game;

  constructor(game: Game) {
    this.game = game;
  }

  readInput({
    keypress = () => undefined,
    click = () => undefined
  }: { keypress: (action: string) => actions | void, click: (action: string) => actions | void }): Promise<actions | void> {
    return new Promise((resolve, reject) => {
      // HACK: Advance the game without making a move.
      this.game.on('resetState', () => reject(new Error('Game reset')));

      document.body.addEventListener(
        'keypress',
        (event) => {
          if (!this.game.settings.element || !document.querySelector(this.game.settings.element)) {
            return;
          }

          resolve(keypress(event.key as actionDataKeys));
        },
        { once: true }
      );

      const clickHandler = (event: Event) => {
        if (!(event.target instanceof HTMLElement)) {
          return;
        }

        const handlerResult = click(event.target?.dataset.action || '');
        if (handlerResult) {
          document.body.removeEventListener('click', clickHandler);
          resolve(handlerResult);
        }
      };

      document.body.addEventListener('click', clickHandler);
    });
  }
}
