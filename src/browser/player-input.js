import PlayerInput from '../player-input.js';

export default class DOMPlayerInput extends PlayerInput {
  static readKeypress(resultCallback = () => {}) {
    return new Promise((resolve, reject) => {
      document.body.addEventListener(
        'keypress',
        (event) => {
          resolve(resultCallback(event.key));
        },
        { once: true }
      );
    });
  }
}
