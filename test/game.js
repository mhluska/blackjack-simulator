import sinon from 'sinon';
import assert from 'assert';
import Game from '../src/game.js';
import Card from '../src/card.js';

function setupGame(options = {}) {
  const defaultOptions = {
    gameOptions: { animationDelay: 0, playerCount: 1, playerTablePosition: 1 },
    repeatPlayerInput: false,
    playerInput: [
      {
        'game-result': true,
        'waiting-for-move': 'hit',
        'ask-insurance': 'no-insurance',
      },
    ],
    cards: '',
  };

  const gameOptions = Object.assign(
    {},
    defaultOptions.gameOptions,
    options.gameOptions
  );

  Object.assign(defaultOptions, options);

  const game = new Game(gameOptions);

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

  let callCount = 0;

  sinon.stub(game.playerInputReader, 'readInput').callsFake(() => {
    const promise =
      defaultOptions.playerInput.length === 0 ||
      callCount > defaultOptions.playerInput.length - 1
        ? new Promise(() => {})
        : Promise.resolve(
            defaultOptions.playerInput[callCount][game.state.step]
          );

    if (callCount < defaultOptions.playerInput.length) {
      if (
        callCount !== defaultOptions.playerInput.length - 1 ||
        !defaultOptions.repeatPlayerInput
      ) {
        callCount += 1;
      }
    }

    return promise;
  });

  return game;
}

describe('Game', function () {
  let game;

  before(function () {
    game = setupGame({
      repeatPlayerInput: true,
    });
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

      const betAmount = 10 * 100;

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
          playerInput: [],
          // Force a hand that prompts for insurance (dealer Ace).
          cards: '?A',
        });

        game.step();
      });

      it('should not pause for player input', function () {
        assert.notEqual(game.state.step, 'ask-insurance');
      });
    });

    context('when late surrender is enabled', function () {
      context('when only two cards are dealt', function () {
        before(function () {
          game = setupGame({
            gameOptions: {
              allowLateSurrender: true,
            },
            playerInput: [
              {
                'game-result': true,
                'waiting-for-move': 'surrender',
                'ask-insurance': 'no-insurance',
              },
            ],
            cards: '6QJJ',
          });

          game.step();
        });

        it('should allow late surrender', function () {
          assert.equal(game.state.step, 'game-result');
          assert.equal(Object.values(game.player.handWinner)[0], 'dealer');
        });
      });

      context('when more than two cards are dealt', function () {
        before(function () {
          game = setupGame({
            gameOptions: {
              allowLateSurrender: true,
            },
            playerInput: [
              {
                'game-result': true,
                'waiting-for-move': 'hit',
                'ask-insurance': 'no-insurance',
              },
              {
                'game-result': true,
                'waiting-for-move': 'surrender',
                'ask-insurance': 'no-insurance',
              },
            ],
            cards: '6QJJ2',
          });

          game.step();
        });

        it('should not allow late surrender', function () {
          assert.equal(game.state.step, 'waiting-for-move');
        });
      });
    });
  });
});
