import PlayerInputReader from 'player-input-reader';
import EventEmitter from './event-emitter.js';
import Utils from './utils.js';
import Shoe from './shoe.js';
import Dealer from './dealer.js';
import Player from './player.js';
import DiscardTray from './discard-tray.js';
import BasicStrategyChecker from './basic-strategy-checker.js';
import HiLoDeviationChecker from './hi-lo-deviation-checker.js';

const SETTINGS_DEFAULTS = {
  animationDelay: 200,
  deckCount: 2,
  allowSurrender: false,
  allowLateSurrender: false,
  checkDeviations: false,
  // Can be one of 'default', 'pairs', 'uncommon', 'illustrious18'. If the mode
  // is set to 'illustrious18', `checkDeviations` will be forced to true.
  gameMode: 'default',
};

export default class Game extends EventEmitter {
  constructor(settings = {}) {
    super();

    this.playerInputReader = new PlayerInputReader(this);
    this.updateSettings(Object.assign({}, SETTINGS_DEFAULTS, settings));
    this._setupState();
  }

  updateSettings(settings) {
    this.settings = Object.assign({}, this.settings, settings);
  }

  resetState() {
    this._setupState();
    this.emit('resetState');
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
    this.dealer.takeCard(this.shoe.drawCard({ showingFace: false }), {
      prepend: true,
    });

    // TODO: Handle Ace upcard, ask insurance
    for (let hand of this.player.hands) {
      this.state.focusedHand = hand;
      await this._playHand(hand);
    }

    // These moves introduce a card so add a delay to make the UI less jarring.
    if (this.lastInput === 'hit' || this.lastInput === 'double') {
      await Utils.sleep(this.settings.animationDelay);
    }

    this.dealer.cards[0].flip();

    // Dealer draws cards until they reach 17. However, if all player hands have
    // busted, this step is skipped.
    if (!this._allPlayerHandsBusted()) {
      while (this.dealer.cardTotal < 17) {
        await Utils.sleep(this.settings.animationDelay);
        this.dealer.takeCard(this.shoe.drawCard());
      }
    }

    for (let hand of this.player.hands) {
      if (this.state.handWinner[hand.id]) {
        continue;
      }

      if (this.dealer.busted) {
        this._setHandWinner({ winner: 'player', hand });
      } else if (this.dealer.cardTotal > hand.cardTotal) {
        this._setHandWinner({ winner: 'dealer', hand });
      } else if (hand.cardTotal > this.dealer.cardTotal) {
        this._setHandWinner({ winner: 'player', hand });
      } else {
        this._setHandWinner({ winner: 'push', hand });
      }
    }

    await this._getPlayerNewGameInput();

    this.state.playCorrection = '';
    this.discardTray.addCards(this.player.removeCards());
    this.discardTray.addCards(this.dealer.removeCards());

    if (this.shoe.needsReset) {
      this.shoe.addCards(
        this.discardTray.removeCards().concat(this.shoe.removeCards())
      );
      this.shoe.shuffle();

      this.emit('shuffle');
    }
  }

  _setupState() {
    this.gameId = null;
    this.lastInput = null;

    this.shoe = new Shoe({
      deckCount: this.settings.deckCount,
      gameMode: this.settings.gameMode,
    });
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
      handWinner: {},
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

  _getPlayerMoveInput(hand) {
    this.state.step = 'waiting-for-move';

    const inputHandler = (str) =>
      ({
        h: 'hit',
        s: 'stand',
        d: 'double',
        p: 'split',
        r: 'surrender',
      }[str.toLowerCase()]);

    return this.playerInputReader.readInput({
      keypress: inputHandler,
      click: inputHandler,
    });
  }

  _getPlayerNewGameInput() {
    this.state.step = 'game-result';

    return this.playerInputReader.readInput({
      keypress: () => true,
      click: (str) => str.toLowerCase() === 'd',
    });
  }

  _setHandWinner({ winner, hand }) {
    this.state.handWinner[hand.id] = winner;

    this.emit('create-record', 'hand-result', {
      createdAt: Date.now(),
      gameId: this.gameId,
      dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
      playerHand: hand.serialize(),
      winner: winner,
    });
  }

  _allPlayerHandsBusted() {
    return this.player.hands.every((hand) => hand.busted);
  }

  async _playHand(hand) {
    if (this.dealer.blackjack && hand.blackjack) {
      return this._setHandWinner({ winner: 'push', hand });
    } else if (this.dealer.blackjack) {
      return this._setHandWinner({ winner: 'dealer', hand });
    } else if (hand.blackjack) {
      return this._setHandWinner({ winner: 'player', hand });
    }

    while (hand.cardTotal < 21) {
      const input = await this._getPlayerMoveInput(hand);

      if (!input) {
        continue;
      }

      if (
        input === 'surrender' &&
        !hand.firstMove &&
        !this.settings.allowLateSurrender
      ) {
        continue;
      }

      // TODO: Allow max x number of splits (4 splits?).
      if (input === 'split' && !hand.hasPairs) {
        continue;
      }

      this.lastInput = input;

      const checkerResult =
        HiLoDeviationChecker.check(this, input) ||
        BasicStrategyChecker.check(this, input);

      this.state.playCorrection = checkerResult?.hint;

      this.emit('create-record', 'move', {
        createdAt: Date.now(),
        gameId: this.gameId,
        dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
        playerHand: this.state.focusedHand.serialize(),
        move: input,
        correction: checkerResult?.code,
      });

      if (input === 'stand') {
        break;
      }

      if (input === 'hit') {
        this.player.takeCard(this.shoe.drawCard(), { hand });
      }

      // TODO: Double the bet here once betting is supported.
      // TODO: Only allow double on first move?
      if (input === 'double') {
        this.player.takeCard(this.shoe.drawCard(), { hand });
        break;
      }

      // TODO: Allow max x number of splits (4 splits?).
      if (input === 'split') {
        const newHand = this.player.addHand([hand.cards.pop()]);

        this.player.takeCard(this.shoe.drawCard(), { hand });
        this.player.takeCard(this.shoe.drawCard(), { hand: newHand });
      }

      if (input === 'surrender') {
        return this._setHandWinner({ winner: 'dealer', hand });
      }
    }

    if (hand.cardTotal === 21) {
      return this._setHandWinner({ winner: 'player', hand });
    }

    if (hand.busted) {
      return this._setHandWinner({ winner: 'dealer', hand });
    }
  }
}
