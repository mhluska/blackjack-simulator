import PlayerInput from '../player-input.js';

export default class CLIPlayerInput extends PlayerInput {
  static readInput({ keypress = () => {}, click = () => {} } = {}) {
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
