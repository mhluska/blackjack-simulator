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
  maxHandsAllowed: 4,
  allowSurrender: false,
  allowLateSurrender: false,
  checkDeviations: false,
  checkTopNDeviations: 18,
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

  async step({ betAmount = 0 } = {}) {
    this.player.useChips(betAmount);

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

    // Dealer peeks at the hole card if the upcard is 10 to check blackjack.
    if (this.dealer.upcard.value === 10 && this.dealer.holeCard.value === 11) {
      this._setHandWinner({ winner: 'dealer' });
    }

    // Dealer peeks at the hole card if the upcard is ace to ask insurance.
    if (this.dealer.upcard.value === 11) {
      let input;
      while (!input?.includes('insurance')) {
        input = await this._getPlayerInsuranceInput();
      }

      this._validateInput(input);

      if (this.dealer.holeCard.value === 10) {
        this._setHandWinner({ winner: 'dealer' });

        // TODO: Make insurance amount configurable. Currently uses half the
        // bet size as insurance to recover full bet amount.
        this.player.addChips(betAmount);
      }
    }

    for (let hand of this.player.hands) {
      if (this.state.handWinner[hand.id]) {
        continue;
      }

      this.state.focusedHand = hand;
      await this._playHand(hand, betAmount);
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

  _chainEmitChange(object) {
    object.on('change', (name, value) => this.emit('change', name, value));
    return object;
  }

  _setupState() {
    this.gameId = null;
    this.lastInput = null;

    this.shoe = this._chainEmitChange(new Shoe(this));
    this.discardTray = this._chainEmitChange(new DiscardTray());
    this.dealer = this._chainEmitChange(new Dealer());
    this.player = this._chainEmitChange(new Player());

    this._state = {
      handWinner: {},
      focusedHand: this.player.hands[0],
      playCorrection: null,
      sessionMovesTotal: 0,
      sessionMovesCorrect: 0,
    };

    this.state = new Proxy(this._state, {
      set: (target, key, value) => {
        target[key] = value;
        this.emit('change', key, value.attributes?.() ?? value);
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

  _getPlayerInsuranceInput() {
    this.state.step = 'ask-insurance';

    const inputHandler = (str) =>
      ({
        n: 'no-insurance',
        y: 'buy-insurance',
      }[str.toLowerCase()]);

    return this.playerInputReader.readInput({
      keypress: inputHandler,
      click: inputHandler,
    });
  }

  _setHandWinner({ winner, hand = this.player.hands[0] }) {
    // NOTE: We overwrite the entire object to trigger a change with `Proxy`.
    this.state.handWinner = { ...this.state.handWinner, [hand.id]: winner };

    if (winner === 'player') {
      this.player.addChips(hand.betAmount * 2);
    } else if (winner === 'push') {
      this.player.addChips(hand.betAmount);
    }

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

  _validateInput(input) {
    this.lastInput = input;

    const checkerResult =
      HiLoDeviationChecker.check(this, input) ||
      BasicStrategyChecker.check(this, input);

    if (checkerResult?.hint) {
      this.state.playCorrection = checkerResult.hint;
    } else {
      this.state.sessionMovesCorrect += 1;
    }

    this.state.sessionMovesTotal += 1;

    this.emit('create-record', 'move', {
      createdAt: Date.now(),
      gameId: this.gameId,
      dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
      playerHand: this.state.focusedHand.serialize(),
      move: input,
      correction: checkerResult?.code,
    });
  }

  async _playHand(hand, betAmount) {
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

      if (input === 'split' && !hand.hasPairs) {
        continue;
      }

      this._validateInput(input);

      if (input === 'stand') {
        break;
      }

      if (input === 'hit') {
        this.player.takeCard(this.shoe.drawCard(), { hand });
      }

      if (input === 'double' && hand.firstMove) {
        this.player.useChips(betAmount, { hand });
        this.player.takeCard(this.shoe.drawCard(), { hand });
        break;
      }

      if (
        input === 'split' &&
        this.player.hands.length < this.settings.maxHandsAllowed
      ) {
        const newHand = this.player.addHand([hand.cards.pop()], betAmount);

        hand.fromSplit = true;

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
