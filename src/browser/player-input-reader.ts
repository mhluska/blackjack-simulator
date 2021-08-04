import PlayerInputReader from '../player-input-reader';
import { actionDataKeyToAction, actions } from '../types';

export default class DOMPlayerInputReader implements PlayerInputReader {
  readInput(callback: (action: actions) => void): void {
    document.body.addEventListener(
      'keypress',
      (event) => {
        const action = actionDataKeyToAction(event.key);
        if (action) {
          callback(action);
        }
      },
      { once: true }
    );

    const clickHandler = (event: Event) => {
      if (!(event.target instanceof HTMLElement)) {
        return;
      }

      const action = actionDataKeyToAction(event.target?.dataset.action ?? '');

      if (action) {
        document.body.removeEventListener('click', clickHandler);
        callback(action);
      }
    };

    document.body.addEventListener('click', clickHandler);
  }
}
