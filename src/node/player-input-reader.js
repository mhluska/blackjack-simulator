import PlayerInputReader from '../player-input-reader.js';

export default class CLIPlayerInputReader extends PlayerInputReader {
  readInput({ keypress = () => {}, click = () => {} } = {}) {
    return new Promise((resolve, reject) => {
      process.stdin.once('keypress', (str, key) => {
        if (key && key.ctrl && key.name === 'c') {
          process.stdin.pause();
          return;
        }

        resolve(keypress(str));
      });
    });
  }
}
