import PlayerInputReader from '../player-input-reader';
import { actionDataKeyToCorrectMove, Move } from '../types';

export default class DOMPlayerInputReader implements PlayerInputReader {
  readInput(callback: (action: Move) => void): void {
    const keypressHandler = (event: KeyboardEvent) => {
      const action = actionDataKeyToCorrectMove(event.key);
      if (action) {
        document.body.removeEventListener('click', clickHandler);
        callback(action);
      }
    };

    document.body.addEventListener('keypress', keypressHandler);

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
