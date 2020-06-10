const EventEmitter = require('events');
const readline = require('readline');

const Shoe = require('./shoe');
const Dealer = require('./dealer');
const Player = require('./player');
const DiscardTray = require('./discard-tray');
const Utils = require('./utils');

module.exports = class Game extends EventEmitter {
  constructor() {
    super();

    this.resetState();
    this.setupCliInput();
  }

  getPlayerMoveInput() {
    this.state.question =
      'H (hit), S (stand), D (double), P (split), R (surrender)? ';

    return this._getPlayerInput(
      (str) =>
        ({
          h: 'hit',
          s: 'stand',
          d: 'double',
          p: 'split',
          r: 'surrender',
        }[str.toLowerCase()])
    );
  }

  getPlayerNewGameInput() {
    if (!this.state.winner) {
      return;
    }

    const gameResult = () => {
      switch (this.state.winner) {
        case 'player':
          return 'Player wins';
        case 'dealer':
          return 'Dealer wins';
        case 'push':
          return 'Push';
      }
    };

    this.state.question = `${gameResult()} (press any key for next hand)`;

    return this._getPlayerInput((str) => true);
  }

  resetState() {
    this.shoe = new Shoe();
    this.shoe.on('change', () => this.emit('change', { caller: 'shoe' }));

    this.discardTray = new DiscardTray();
    this.discardTray.on('change', () =>
      this.emit('change', { caller: 'discard-tray' })
    );

    this.dealer = new Dealer();
    this.dealer.on('change', () => this.emit('change', { caller: 'dealer' }));

    this.player = new Player();
    this.player.on('change', () => this.emit('change', { caller: 'player' }));

    this._state = {
      question: null,
      winner: null,
    };

    this.state = new Proxy(this._state, {
      set: (target, key, value) => {
        target[key] = value;
        this.emit('change', { caller: 'game' });
        return true;
      },
    });
  }

  setupCliInput() {
    // Allows collecting keypress events in `getPlayerMoveInput`.
    readline.emitKeypressEvents(process.stdin);

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
  }

  async finishGame({ winner }) {
    this.state.winner = winner;

    await this.getPlayerNewGameInput();

    this.discardTray.addCards(this.player.removeCards());
    this.discardTray.addCards(this.dealer.removeCards());

    if (this.shoe.needsReset) {
      this.shoe.addCards(
        Utils.arrayShuffle(
          this.discardTray.removeCards().concat(this.shoe.removeCards())
        )
      );
    }
  }

  async start() {
    // Draw card for player face up (upcard).
    this.player.takeCard(this.shoe.drawCard());

    // Draw card for dealer face up.
    this.dealer.takeCard(this.shoe.drawCard());

    // Draw card for player face up.
    this.player.takeCard(this.shoe.drawCard());

    // Draw card for dealer face down (hole card).
    this.dealer.takeCard(this.shoe.drawCard({ showingFace: false }));

    // TODO: Handle Ace upcard, ask insurance

    if (this.dealer.blackjack && this.player.blackjack) {
      return await this.finishGame({ winner: 'push' });
    } else if (this.dealer.blackjack) {
      return await this.finishGame({ winner: 'dealer' });
    } else if (this.player.blackjack) {
      return await this.finishGame({ winner: 'player' });
    }

    while (this.player.cardTotal < 21) {
      const input = await this.getPlayerMoveInput();
      if (input === 'stand') {
        break;
      }

      if (input === 'hit') {
        this.player.takeCard(this.shoe.drawCard());
      }

      if (input === 'double') {
        this.player.takeCard(this.shoe.drawCard());

        // TODO: Double the bet here once betting is supported.

        break;
      }

      // TODO: Handle this ase.
      if (input === 'split') {
      }

      if (input === 'surrender') {
        return await this.finishGame({ winner: 'dealer' });
      }
    }

    if (this.player.cardTotal === 21) {
      return await this.finishGame({ winner: 'player' });
    }

    if (this.player.busted) {
      return await this.finishGame({ winner: 'dealer' });
    }

    this.dealer.cards[1].flip();

    // Dealer draws cards until they reach 17.
    while (this.dealer.cardTotal < 17) {
      this.dealer.takeCard(this.shoe.drawCard());
    }

    if (this.dealer.busted) {
      await this.finishGame({ winner: 'player' });
    } else if (this.dealer.cardTotal > this.player.cardTotal) {
      await this.finishGame({ winner: 'dealer' });
    } else if (this.player.cardTotal > this.dealer.cardTotal) {
      await this.finishGame({ winner: 'player' });
    } else {
      await this.finishGame({ winner: 'push' });
    }
  }

  _getPlayerInput(resultCallback) {
    return new Promise((resolve, reject) => {
      process.stdin.once('keypress', (str, key) => {
        if (key && key.ctrl && key.name === 'c') {
          process.stdin.pause();
          return;
        }

        const result = resultCallback(str);

        if (result) {
          resolve(result);
        }
      });
    });
  }
};
