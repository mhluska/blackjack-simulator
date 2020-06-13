import Storage from 'storage';

import PlayerInput from 'player-input';
import EventEmitter from './event-emitter.js';
import Utils from './utils.js';
import Shoe from './shoe.js';
import Dealer from './dealer.js';
import Player from './player.js';
import DiscardTray from './discard-tray.js';
import BasicStrategyChecker from './basic-strategy-checker.js';

export default class Game extends EventEmitter {
  constructor() {
    super();

    this.resetState();
  }

  getPlayerMoveInput(hand) {
    this.state.step = 'waiting-for-move';

    return PlayerInput.readKeypress(
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
    this.state.step = 'game-result';

    return PlayerInput.readKeypress();
  }

  resetState() {
    this.gameId = null;

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

  setHandWinner({ winner, hand }) {
    this.state.handWinner.set(hand, winner);

    Storage.createRecord('hand-result', {
      createdAt: Date.now(),
      gameId: this.gameId,
      dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
      playerHand: hand.serialize(),
      winner: winner,
    });
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
      const input = await this.getPlayerMoveInput(hand);

      if (!input) {
        continue;
      }

      const {
        code: playCorrectionCode,
        hint: playCorrection,
      } = BasicStrategyChecker.check(this, input);

      if (playCorrection) {
        this.state.playCorrection = playCorrection;

        Storage.createRecord('wrong-move', {
          createdAt: Date.now(),
          gameId: this.gameId,
          dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
          playerHand: this.state.focusedHand.serialize(),
          move: input,
          correction: playCorrectionCode,
        });
      } else {
        this.state.playCorrection = '';
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
        this.player.takeCard(this.shoe.drawCard(), { hand: newHand });
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
    // We assign a random ID to each game so that we can link hand results with
    // wrong moves in the database.
    this.gameId = Utils.randomId();

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
}
