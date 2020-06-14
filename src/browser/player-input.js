import PlayerInput from '../player-input.js';

export default class DOMPlayerInput extends PlayerInput {
  static readInput({ keypress = () => {}, click = () => {} } = {}) {
    return new Promise((resolve, reject) => {
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
