import assert from 'assert';
import PlayerInputReader from 'player-input-reader';

import EventEmitter from './event-emitter.js';
import Utils from './utils.js';
import Shoe from './shoe.js';
import Dealer from './dealer.js';
import Player, { PLAYER_STRATEGY } from './player.js';
import DiscardTray from './discard-tray.js';
import BasicStrategyChecker from './basic-strategy-checker.js';
import HiLoDeviationChecker from './hi-lo-deviation-checker.js';

const SETTINGS_DEFAULTS = {
  animationDelay: 200,
  deckCount: 2,
  maxHandsAllowed: 4,
  playerCount: 6,
  playerTablePosition: 2,
  tableMaxPositions: 6,
  allowLateSurrender: false,
  checkDeviations: false,
  checkTopNDeviations: 18,
  // Can be one of 'default', 'pairs', 'uncommon', 'illustrious18'. If the mode
  // is set to 'illustrious18', `checkDeviations` will be forced to true.
  gameMode: 'default',
  autoDeclineInsurance: false,
  minimumBet: 10 * 100,
  maximumBet: 1000 * 100,
};

export default class Game extends EventEmitter {
  constructor(settings = {}) {
    super();

    const InputReader = settings.playerInputReader ?? PlayerInputReader;

    this.playerInputReader = new InputReader(this);
    this.updateSettings(Object.assign({}, SETTINGS_DEFAULTS, settings));
    this._setupState();
  }

  updateSettings(settings) {
    this.settings = Object.assign({}, this.settings, settings);

    assert(
      this.settings.playerTablePosition <= this.settings.playerCount &&
        this.settings.playerTablePosition > 0,
      `Player table position (${this.settings.playerTablePosition}) must be greater than 0 and less than player count (${this.settings.playerCount})`
    );
  }

  resetState() {
    this._setupState();
    this.emit('resetState');
  }

  async step({ betAmount = this.settings.minimumBet } = {}) {
    assert(
      betAmount >= this.settings.minimumBet &&
        betAmount <= this.settings.maximumBet,
      `Bet amount must be within ${Utils.formatCents(
        this.settings.minimumBet
      )} and ${Utils.formatCents(this.settings.maximumBet)}`
    );

    this.players.forEach((player) =>
      // TODO: Make NPCs bet more realistically than minimum bet.
      player.useChips(player.isUser ? betAmount : this.settings.minimumBet)
    );

    // We assign a random ID to each game so that we can link hand results with
    // wrong moves in the database.
    this.gameId = Utils.randomId();

    // Draw card for each player face up (upcard).
    this.players.forEach((player) => player.takeCard(this.shoe.drawCard()));

    // Draw card for dealer face up.
    this.dealer.takeCard(this.shoe.drawCard());

    // Draw card for each player face up again (upcard).
    this.players.forEach((player) => player.takeCard(this.shoe.drawCard()));

    // Draw card for dealer face down (hole card).
    this.dealer.takeCard(this.shoe.drawCard({ showingFace: false }), {
      prepend: true,
    });

    // Dealer peeks at the hole card if the upcard is 10 to check blackjack.
    if (this.dealer.upcard.value === 10 && this.dealer.holeCard.value === 11) {
      this.players.forEach((player) =>
        player.setHandWinner({ winner: 'dealer' })
      );
    }

    await this._handleInsurance(betAmount);

    for (let player of this.players) {
      await this._playHands(
        player,
        // TODO: Make NPCs bet more realistically than minimum bet.
        player.isUser ? betAmount : this.settings.minimumBet
      );
    }

    this.dealer.cards[0].flip();

    // Dealer draws cards until they reach 17. However, if all player hands have
    // busted, this step is skipped.
    if (!this._allPlayerHandsBusted()) {
      while (this.dealer.cardTotal < 17) {
        // TODO: Move this concern to the UI layer.
        await Utils.sleep(this.settings.animationDelay);
        this.dealer.takeCard(this.shoe.drawCard());
      }
    }

    this.players.forEach((player) => this._setHandResults(player));

    await this._getPlayerNewGameInput();

    this.state.playCorrection = '';

    this.players.forEach((player) =>
      this.discardTray.addCards(player.removeCards())
    );

    this.discardTray.addCards(this.dealer.removeCards());

    if (this.shoe.needsReset) {
      this.shoe.addCards(
        this.discardTray.removeCards().concat(this.shoe.removeCards())
      );
      this.shoe.shuffle();
      this.emit('shuffle');
    }
  }

  async _handleInsurance(betAmount) {
    if (this.dealer.upcard.value !== 11) {
      return;
    }

    let input;

    if (this.settings.autoDeclineInsurance) {
      input = 'no-insurance';
    } else {
      while (!input?.includes('insurance')) {
        input = await this._getPlayerInsuranceInput();
      }

      this._validateInput(input);
    }

    // Dealer peeks at the hole card if the upcard is ace to ask insurance.
    if (this.dealer.holeCard.value !== 10) {
      return;
    }

    this.players.forEach((player) =>
      player.setHandWinner({ winner: 'dealer' })
    );

    // TODO: Make insurance amount configurable. Currently uses half the
    // bet size as insurance to recover full bet amount.
    if (input === 'buy-insurance') {
      this.player.addChips(betAmount);
    }
  }

  _chainEmitChange(object) {
    object.on('change', (name, value) => this.emit('change', name, value));
    return object;
  }

  _setupState() {
    this.gameId = null;

    this.shoe = this._chainEmitChange(new Shoe(this));
    this.discardTray = this._chainEmitChange(new DiscardTray());
    this.dealer = this._chainEmitChange(new Dealer());
    this.players = Array.from(
      { length: this.settings.playerCount },
      (_item, index) =>
        this._chainEmitChange(
          new Player({
            strategy:
              index === this.settings.playerTablePosition - 1
                ? PLAYER_STRATEGY.USER_INPUT
                : PLAYER_STRATEGY.PERFECT_BASIC_STRATEGY,
          })
        )
    );

    this.player = this.players[this.settings.playerTablePosition - 1];
    this.player.on('hand-winner', (hand, winner) => {
      this.emit('create-record', 'hand-result', {
        createdAt: Date.now(),
        gameId: this.gameId,
        dealerHand: this.dealer.hands[0].serialize({ showHidden: true }),
        playerHand: hand.serialize(),
        winner,
      });
    });

    this._state = {
      // TODO: Fix this state not updating. Each time a card is taken, an event
      // should be emitted because `focusedHand.firstMove` should be updated.
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

  _allPlayerHandsBusted() {
    return this.players.every((player) =>
      player.hands.every((hand) => hand.busted)
    );
  }

  _validateInput(input) {
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

  async _playHands(player, betAmount) {
    for (let hand of player.hands) {
      if (player.handWinner[hand.id]) {
        continue;
      }

      await this._playHand(player, hand, betAmount);
    }
  }

  async _playHand(player, hand, betAmount) {
    if (player.isUser) {
      this.state.focusedHand = hand;
    }

    if (this.dealer.blackjack && hand.blackjack) {
      return player.setHandWinner({ winner: 'push', hand });
    } else if (this.dealer.blackjack) {
      return player.setHandWinner({ winner: 'dealer', hand });
    } else if (hand.blackjack) {
      return player.setHandWinner({ winner: 'player', hand });
    }

    let input;

    while (hand.cardTotal < 21) {
      // TODO: Return optimal basic strategy move.
      input = player.isNPC
        ? 'hit'
        : await this._getPlayerMoveInput(player, hand);

      // TODO: Skip this validation logic for NPC?
      if (!input) {
        continue;
      }

      if (input === 'surrender' && !this.settings.allowLateSurrender) {
        continue;
      }

      if (
        input === 'surrender' &&
        this.settings.allowLateSurrender &&
        !hand.firstMove
      ) {
        continue;
      }

      if (input === 'split' && !hand.hasPairs) {
        continue;
      }

      if (player.isUser) {
        this._validateInput(input);
      }

      if (input === 'stand') {
        break;
      }

      if (input === 'hit') {
        player.takeCard(this.shoe.drawCard(), { hand });
      }

      if (input === 'double' && hand.firstMove) {
        player.useChips(betAmount, { hand });
        player.takeCard(this.shoe.drawCard(), { hand });
        break;
      }

      if (
        input === 'split' &&
        player.hands.length < this.settings.maxHandsAllowed
      ) {
        const newHand = player.addHand([hand.cards.pop()], betAmount);

        hand.fromSplit = true;

        player.takeCard(this.shoe.drawCard(), { hand });
        player.takeCard(this.shoe.drawCard(), { hand: newHand });
      }

      if (input === 'surrender') {
        break;
      }
    }

    if (player.isUser) {
      // These moves introduce a card so add a delay to make the UI less jarring.
      if (input === 'hit' || input === 'double') {
        // TODO: Move this concern to the UI layer.
        await Utils.sleep(this.settings.animationDelay);
      }
    }

    if (input === 'surrender') {
      return player.setHandWinner({ winner: 'dealer', hand });
    }

    if (hand.cardTotal === 21) {
      return player.setHandWinner({ winner: 'player', hand });
    }

    if (hand.busted) {
      return player.setHandWinner({ winner: 'dealer', hand });
    }
  }

  _setHandResults(player) {
    for (let hand of player.hands) {
      if (player.handWinner[hand.id]) {
        continue;
      }

      if (this.dealer.busted) {
        player.setHandWinner({ winner: 'player', hand });
      } else if (this.dealer.cardTotal > hand.cardTotal) {
        player.setHandWinner({ winner: 'dealer', hand });
      } else if (hand.cardTotal > this.dealer.cardTotal) {
        player.setHandWinner({ winner: 'player', hand });
      } else {
        player.setHandWinner({ winner: 'push', hand });
      }
    }
  }
}
