import PlayerInputReader from '../player-input-reader';
import { actionDataKeyToCorrectMove, Move } from '../types';

export default class CLIPlayerInputReader implements PlayerInputReader {
  readInput(callback: (action: Move) => void): void {
    const handler = (str: string, key: { [key: string]: string | boolean }) => {
      if (key !== undefined && key.ctrl === true && key.name === 'c') {
        process.stdin.pause();
        return;
      }

      const action = actionDataKeyToCorrectMove(str);
      if (action !== undefined) {
        process.stdin.off('keypress', handler);
        callback(action);
      }
    };

    process.stdin.on('keypress', handler);
  }
}
