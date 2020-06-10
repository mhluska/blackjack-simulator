const EventEmitter = require('events');
const readline = require('readline');

const Shoe = require('./shoe');
const Dealer = require('./dealer');
const Player = require('./player');

module.exports = class Game extends EventEmitter {
  constructor() {
    super();

    // Game state
    // TODO: Rerender whenever game state changes instead of calling render.
    this.shoe = new Shoe();
    this.shoe.on('change', () => this.emit('change', { caller: 'shoe' }));

    this.dealer = new Dealer();
    this.dealer.on('change', () => this.emit('change', { caller: 'dealer' }));

    this.player = new Player();
    this.player.on('change', () => this.emit('change', { caller: 'player' }));

    this.question = null;
    this.winner = null;

    // TODO: Use this if we get more local state like `this.winner`.
    // new Proxy(this, {
    //   set: function (target, key, value) {
    //     console.log(`RENDER? ${key} set to ${value}`);
    //     target[key] = value;
    //     return true;
    //   }
    // });

    // Allows collecting keypress events in `getPlayerMoveInput`.
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  getPlayerMoveInput() {
    this.question =
      'H (hit), S (stand), D (double), P (split), R (surrender)? ';
    this.emit('change', { caller: 'game' });

    return new Promise((resolve, reject) => {
      // TODO: Make backspace not mess up the display.
      const handler = (str, key) => {
        if (key && key.ctrl && key.name === 'c') {
          process.stdin.pause();
          return;
        }

        const result = {
          h: 'hit',
          s: 'stand',
          d: 'double',
          p: 'split',
          r: 'surrender',
        }[str.toLowerCase()];

        if (result) {
          process.stdin.off('keypress', handler);
          resolve(result);
        }
      };

      process.stdin.on('keypress', handler);
    });
  }

  async start() {
    // 1. Draw card for player face up (upcard).
    this.player.takeCard(this.shoe.drawCard());

    // 2. Draw card for dealer face up.
    this.dealer.takeCard(this.shoe.drawCard());

    // 3. Draw card for player face up.
    this.player.takeCard(this.shoe.drawCard());

    // 4. Draw card for dealer face down (hole card).
    this.dealer.takeCard(this.shoe.drawCard({ showingFace: false }));

    while (!this.player.busted()) {
      const input = await this.getPlayerMoveInput();
      if (input === 'stand') {
        break;
      }

      if (input === 'hit') {
        this.player.takeCard(this.shoe.drawCard());
      }

      this.player.move(input);
    }

    if (this.player.busted()) {
      this.winner = 'dealer';
      this.emit('change', { caller: 'game' });
      return;
    }

    // TODO: Handle Ace upcard, ask insurance

    this.dealer.cards[1].flip();

    // TODO: Magic number.
    while (this.dealer.cardTotal < 17) {
      this.dealer.move();
    }

    if (this.dealer.busted()) {
    } else {
    }

    // TODO: Magic number.
    if (this.dealer.cardTotal > 21 && !this.player.busted()) {
      this.winner = 'player';
      this.emit('change', { caller: 'game' });
      return;
    }
  }
};
