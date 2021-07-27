import PlayerInputReader from '../player-input-reader';
import { actions, actionDataKeyToAction } from '../types';

export default class CLIPlayerInputReader implements PlayerInputReader {
  readInput(callback: (action: actions) => void): void {
    const handler = (str: string, key: { [key: string]: string | boolean }) => {
      if (key && key.ctrl && key.name === 'c') {
        process.stdin.pause();
        return;
      }

      const action = actionDataKeyToAction(str);
      if (action) {
        process.stdin.off('keypress', handler);
        callback(action);
      }
    };

    process.stdin.on('keypress', handler);
  }
}
