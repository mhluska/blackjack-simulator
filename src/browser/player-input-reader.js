import PlayerInputReader from '../player-input-reader.js';

export default class DOMPlayerInputReader extends PlayerInputReader {
  readInput({ keypress = () => {}, click = () => {} } = {}) {
    return new Promise((resolve, reject) => {
      // HACK: Advance the game without making a move.
      this.game.on('resetState', () => reject(new Error('Game reset')));

      document.body.addEventListener(
        'keypress',
        (event) => {
          resolve(keypress(event.key));
        },
        { once: true }
      );

      const clickHandler = (event) => {
        const handlerResult = click(event.target.dataset.action || '');
        if (handlerResult) {
          document.body.removeEventListener('click', clickHandler);
          resolve(handlerResult);
        }
      };

      document.body.addEventListener('click', clickHandler);
    });
  }
}
