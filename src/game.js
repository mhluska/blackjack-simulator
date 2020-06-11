const EventEmitter = require('events');
const readline = require('readline');

const Utils = require('./utils');
const Shoe = require('./shoe');
const Dealer = require('./dealer');
const Player = require('./player');
const DiscardTray = require('./discard-tray');
const BasicStrategyChecker = require('./basic-strategy-checker');

module.exports = class Game extends EventEmitter {
  constructor() {
    super();

    this.resetState();
    this.setupCliInput();
  }

  getPlayerMoveInput(hand) {
    let question = 'H (hit), S (stand), D (double), R (surrender)';

    if (hand.hasPairs) {
      question += ', P (split)';
    }

    question += '? ';

    this.state.question = question;

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
    const getGameResult = (hand) => {
      const blackjack = hand.blackjack ? 'Blackjack! ' : '';

      switch (this.state.handWinner.get(hand)) {
        case 'player':
          return `${blackjack}Player wins`;
        case 'dealer':
          return `${blackjack}Dealer wins`;
        case 'push':
          return 'Push';
      }
    };

    // TODO: Align these results with the hands above.
    const result = this.player.hands
      .map((hand) => getGameResult(hand))
      .join(', ');

    this.state.question = `${result} (press any key for next hand)`;

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
      handWinner: new Map(),
      focusedHand: null,
      playCorrection: null,
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

  setHandWinner({ winner, hand }) {
    this.state.handWinner.set(hand, winner);
  }

  async playHand(hand) {
    if (this.dealer.blackjack && hand.blackjack) {
      return this.setHandWinner({ winner: 'push', hand });
    } else if (this.dealer.blackjack) {
      return this.setHandWinner({ winner: 'dealer', hand });
    } else if (hand.blackjack) {
      return this.setHandWinner({ winner: 'player', hand });
    }

    while (hand.cardTotal < 21) {
      this.state.playCorrection = '';

      const input = await this.getPlayerMoveInput(hand);

      const playCorrection = BasicStrategyChecker.check(this, input);
      if (playCorrection) {
        this.state.playCorrection = playCorrection;
      }

      if (input === 'stand') {
        break;
      }

      if (input === 'hit') {
        this.player.takeCard(this.shoe.drawCard(), { hand });
      }

      // TODO: Double the bet here once betting is supported.
      if (input === 'double') {
        this.player.takeCard(this.shoe.drawCard(), { hand });
        break;
      }

      // TODO: Allow max x number of splits (4 splits?).
      if (input === 'split') {
        if (!hand.hasPairs) {
          continue;
        }

        const newHand = this.player.addHand([hand.cards.pop()]);

        this.player.takeCard(this.shoe.drawCard(), { hand });
        this.player.takeCard(this.shoe.drawCard(), { newHand });
      }

      if (input === 'surrender') {
        return this.setHandWinner({ winner: 'dealer', hand });
      }
    }

    if (hand.cardTotal === 21) {
      return this.setHandWinner({ winner: 'player', hand });
    }

    if (hand.busted) {
      return this.setHandWinner({ winner: 'dealer', hand });
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

    for (let hand of this.player.hands) {
      this.state.focusedHand = hand;
      await this.playHand(hand);
    }

    this.dealer.cards[1].flip();

    // Dealer draws cards until they reach 17.
    while (this.dealer.cardTotal < 17) {
      this.dealer.takeCard(this.shoe.drawCard());
    }

    for (let hand of this.player.hands) {
      if (this.state.handWinner.get(hand)) {
        continue;
      }

      if (this.dealer.busted) {
        this.setHandWinner({ winner: 'player', hand });
      } else if (this.dealer.cardTotal > hand.cardTotal) {
        this.setHandWinner({ winner: 'dealer', hand });
      } else if (hand.cardTotal > this.dealer.cardTotal) {
        this.setHandWinner({ winner: 'player', hand });
      } else {
        this.setHandWinner({ winner: 'push', hand });
      }
    }

    await this.getPlayerNewGameInput();

    this.state.playCorrection = '';
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
