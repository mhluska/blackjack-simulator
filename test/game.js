import sinon from 'sinon';
import assert from 'assert';
import Game from '../src/game.js';
import Card from '../src/card.js';

function setupGame(options = {}) {
  const defaultOptions = {
    gameOptions: { animationDelay: 0 },
    resolvePlayerInput: true,
    cards: '',
  };

  const gameOptions = Object.assign(
    {},
    defaultOptions.gameOptions,
    options.gameOptions
  );

  Object.assign(defaultOptions, options);

  const game = new Game(gameOptions);

  const readInputCallback = defaultOptions.resolvePlayerInput
    ? ({ keypress }) =>
        Promise.resolve(
          {
            'game-result': true,
            'waiting-for-move': 'hit',
            'ask-insurance': 'no-insurance',
          }[game.state.step]
        )
    : () => new Promise(() => {});

  const hand = game.player.hands[0];
  const length = game.shoe.cards.length;

  defaultOptions.cards.split('').forEach((cardRank, index) => {
    game.shoe.cards[length - index - 1] = new Card(
      'hearts',
      // If the input is `?`, the rank is irrelevant. We arbitrarily pick `2`.
      cardRank === '?' ? '2' : cardRank,
      game.shoe
    );
  });

  sinon.stub(game.playerInputReader, 'readInput').callsFake(readInputCallback);

  return game;
}

describe('Game', function () {
  let game;

  before(function () {
    game = setupGame();
  });

  describe('#step()', function () {
    context('when the shoe needs to be reset', function () {
      let cardsBefore;

      before(async function () {
        cardsBefore = game.shoe.cards.length;

        let shuffled = false;
        game.on('shuffle', () => (shuffled = true));
        while (!shuffled) {
          await game.step();
        }
      });

      it('should move all the cards from the discard tray back to the shoe', function () {
        assert.equal(cardsBefore, game.shoe.cards.length);
      });

      it('should reset the hi-lo running count', function () {
        assert.equal(game.shoe.hiLoRunningCount, 0);
      });
    });

    context('when the player bets and wins', function () {
      let playerBalanceBefore;

      const betAmount = 100;

      const game = setupGame({
        // Force a winning hand for the player (Blackjack with A-J).
        cards: 'A?J?',
      });

      before(async function () {
        playerBalanceBefore = game.player.balance;

        await game.step({ betAmount });
      });

      it('should increase the player balance', function () {
        assert.equal(game.player.balance, playerBalanceBefore + betAmount);
      });
    });

    context('when autoDeclineInsurance is enabled', function () {
      let game;

      before(function () {
        game = setupGame({
          gameOptions: { autoDeclineInsurance: true },
          resolvePlayerInput: false,
          // Force a hand that prompts for insurance (dealer Ace).
          cards: '?A',
        });

        game.step();
      });

      it('should not pause for player input', function () {
        assert.notEqual(game.state.step, 'ask-insurance');
      });
    });
  });
});
