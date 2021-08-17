import PlayerInputReader from '../player-input-reader';
import { actionDataKeyToCorrectMove, Move } from '../types';

export default class DOMPlayerInputReader implements PlayerInputReader {
  readInput(callback: (action: Move) => void): void {
    document.body.addEventListener(
      'keypress',
      (event) => {
        const action = actionDataKeyToCorrectMove(event.key);
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

      const action = actionDataKeyToCorrectMove(
        event.target?.dataset.action ?? ''
      );

      if (action) {
        document.body.removeEventListener('click', clickHandler);
        callback(action);
      }
    };

    document.body.addEventListener('click', clickHandler);
  }
}
