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
  disableEvents: false,
  autoDeclineInsurance: false,
  autoConfirmNewGame: false,
  checkDeviations: false,
  checkTopNDeviations: 18,

  // Can be one of 'default', 'pairs', 'uncommon', 'illustrious18'. If the mode
  // is set to 'illustrious18', `checkDeviations` will be forced to true.
  mode: 'default',
  debug: false,

  // TODO: Move these under a player prefix.
  playerBankroll: 10000 * 100,
  playerTablePosition: 2,
  playerStrategyOverride: {},

  tableRules: {
    allowLateSurrender: false,
    deckCount: 2,
    maxHandsAllowed: 4,
    maximumBet: 1000 * 100,
    minimumBet: 10 * 100,
    playerCount: 6,
  },
};

export default class Game extends EventEmitter {
  constructor(settings = {}) {
    super();

    const InputReader = settings.playerInputReader ?? PlayerInputReader;

    this.playerInputReader = new InputReader(this);
    this.updateSettings(Utils.mergeDeep(SETTINGS_DEFAULTS, settings));
    this._setupState();
  }

  updateSettings(settings) {
    this.settings = Utils.mergeDeep({}, settings);

    if (this.settings.disableEvents) {
      EventEmitter.disableEvents = true;
    }
  }

  resetState() {
    this._setupState();
    this.emit('resetState');
  }

  async run({ betAmount = this.settings.tableRules.minimumBet } = {}) {
    this.players.forEach((player) => {
      // TODO: Make NPCs bet more realistically than minimum bet.
      player.useChips(
        player === this.player ? betAmount : this.settings.tableRules.minimumBet
      );

      // Clears the result from the previous iteration. Otherwise this object
      // will grow indefinitely over subsequent `run()` calls.
      player.handWinner = new Map();
    });

    // We assign a random ID to each game so that we can link hand results with
    // wrong moves in the database.
    this.gameId = Utils.randomId();

    // Draw card for each player face up (upcard).
    this.players.forEach((player) => player.takeCard(this.shoe.drawCard()));

    this.dealer.addHand();

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

    // Dealer peeks at the hole card if the upcard is ace to ask insurance.
    if (this.dealer.upcard.value === 11) {
      for (let player of this.players) {
        await this._handleInsurance(
          player,
          player === this.player
            ? betAmount
            : this.settings.tableRules.minimumBet
        );
      }
    }

    for (let player of this.players) {
      await this._playHands(
        player,
        // TODO: Make NPCs bet more realistically than minimum bet.
        player === this.player ? betAmount : this.settings.tableRules.minimumBet
      );
    }

    this.dealer.cards[0].flip();

    // Dealer draws cards until they reach 17. However, if all player hands have
    // busted, this step is skipped.
    if (!this._allPlayerHandsBusted()) {
      while (this.dealer.cardTotal < 17) {
        this.dealer.takeCard(this.shoe.drawCard());
      }
    }

    this.players.forEach((player) => this._setHandResults(player));

    this.state.step = 'game-result';

    if (!this.settings.autoConfirmNewGame) {
      await this._getPlayerNewGameInput();
    }

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

  async _handleInsurance(player, betAmount) {
    let input;

    this.state.step = 'ask-insurance';

    if (player.isNPC) {
      input = player.getNPCInput(this, player.hands[0]);
    } else {
      if (this.settings.autoDeclineInsurance) {
        input = 'no-insurance';
      } else {
        while (!input?.includes('insurance')) {
          input = await this._getPlayerInsuranceInput();
        }

        this._validateInput(input, player.hands[0], player.hands.length);
      }
    }

    if (this.dealer.holeCard.value !== 10) {
      return;
    }

    player.setHandWinner({ winner: 'dealer' });

    // TODO: Make insurance amount configurable. Currently uses half the
    // bet size as insurance to recover full bet amount.
    if (input === 'buy-insurance') {
      player.addChips(betAmount);
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
      { length: this.settings.tableRules.playerCount },
      (_item, index) =>
        this._chainEmitChange(
          new Player({
            // TODO: Make this configurable for each player.
            balance: this.settings.playerBankroll,
            strategy:
              this.settings.playerStrategyOverride[index + 1] ??
              (index === this.settings.playerTablePosition - 1
                ? PLAYER_STRATEGY.USER_INPUT
                : PLAYER_STRATEGY.BASIC_STRATEGY),
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

    this.state = this.settings.disableEvents
      ? this._state
      : new Proxy(this._state, {
          set: (target, key, value) => {
            target[key] = value;
            this.emit('change', key, value.attributes?.() ?? value);
            return true;
          },
        });
  }

  _getPlayerMoveInput(hand) {
    if (this.settings.debug) {
      console.log('Getting player move input');
    }

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
    if (this.settings.debug) {
      console.log('Getting player new game input');
    }

    return this.playerInputReader.readInput({
      keypress: () => true,
      click: (str) => str.toLowerCase() === 'd',
    });
  }

  _getPlayerInsuranceInput() {
    if (this.settings.debug) {
      console.log('Getting player insurance input');
    }

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

  _validateInput(input, hand) {
    const checkerResult =
      HiLoDeviationChecker.check(this, hand, input) ||
      BasicStrategyChecker.check(this, hand, input);

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

    return checkerResult;
  }

  async _playHands(player, betAmount) {
    for (let hand of player.hands) {
      if (player.handWinner.get(hand.id)) {
        continue;
      }

      await this._playHand(player, hand, betAmount);
    }
  }

  async _playHand(player, hand, betAmount) {
    if (player === this.player) {
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
      this.state.step = 'waiting-for-move';

      input = player.isNPC
        ? player.getNPCInput(this, hand)
        : await this._getPlayerMoveInput(player, hand);

      // TODO: Skip this validation logic for NPC?
      if (!input) {
        continue;
      }

      if (
        input === 'surrender' &&
        !this.settings.tableRules.allowLateSurrender
      ) {
        continue;
      }

      if (
        input === 'surrender' &&
        this.settings.tableRules.allowLateSurrender &&
        !hand.firstMove
      ) {
        continue;
      }

      if (input === 'split' && !hand.hasPairs) {
        continue;
      }

      if (player === this.player) {
        this._validateInput(input, hand);
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
        player.hands.length < this.settings.tableRules.maxHandsAllowed
      ) {
        const newHand = player.addHand(betAmount, [hand.cards.pop()]);

        newHand.fromSplit = true;
        hand.fromSplit = true;

        player.takeCard(this.shoe.drawCard(), { hand });
        player.takeCard(this.shoe.drawCard(), { hand: newHand });
      }

      if (input === 'surrender') {
        break;
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
      if (player.handWinner.get(hand.id)) {
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
