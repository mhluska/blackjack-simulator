const crypto = require('crypto');

module.exports = class Utils {
  static arraySum(array) {
    return array.reduce((acc, current) => acc + current, 0);
  }

  // Fisher–Yates shuffle algorithm.
  // See https://stackoverflow.com/a/6274381/659910
  static arrayShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }

    return array;
  }

  static randomId() {
    return crypto.randomBytes(16).toString('hex');
  }
};
