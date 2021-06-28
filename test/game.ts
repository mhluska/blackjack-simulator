import * as sinon from 'sinon';
import * as chai from 'chai';
import Game from '../src/game';
import Card from '../src/card';
import Utils from '../src/utils';
import { Suits, Ranks } from '../src/types';

function setupGame(options = {}) {
  const defaultOptions = Utils.mergeDeep(
    {
      settings: {
        debug: !!process.env.DEBUG,
        animationDelay: 0,
        playerTablePosition: 1,
        tableRules: { playerCount: 1 },
      },
      repeatPlayerInput: false,
      playerInput: [
        {
          'game-result': true,
          'waiting-for-move': 'hit',
          'ask-insurance': 'no-insurance',
        },
      ],
      cards: '',
    },
    options
  );

  const game = new Game(defaultOptions.settings);
  const length = game.shoe.cards.length;

  defaultOptions.cards.split('').forEach((cardRank: Ranks | '?', index: number) => {
    game.shoe.cards[length - index - 1] = new Card(
      Suits.HEARTS,
      // If the input is `?`, the rank is irrelevant. We arbitrarily pick `2`.
      cardRank === '?' ? Ranks.TWO : cardRank,
      game.shoe
    );
  });

  let callCount = 0;

  sinon.stub(game.playerInputReader, 'readInput').callsFake(() => {
    const promise =
      defaultOptions.playerInput.length === 0 ||
      callCount > defaultOptions.playerInput.length - 1
        ? new Promise(() => {/* noop */})
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

const expect = chai.expect;

describe('Game', function () {
  let game: Game;

  before(function () {
    game = setupGame({
      repeatPlayerInput: true,
    });
  });

  describe('#run()', function () {
    context('when the shoe needs to be reset', function () {
      let cardsBefore: number;

      before(async function () {
        cardsBefore = game.shoe.cards.length;

        let shuffled = false;
        game.on('shuffle', () => (shuffled = true));
        while (!shuffled) {
          await game.run();
        }
      });

      it('should move all the cards from the discard tray back to the shoe', function () {
        expect(cardsBefore).to.have.length(game.shoe.cards.length);
      });

      it('should reset the hi-lo running count', function () {
        expect(game.shoe.hiLoRunningCount).to.equal(0);
      });
    });

    context('when the player bets and wins', function () {
      let playerBalanceBefore: number;

      const betAmount = 10 * 100;

      const game = setupGame({
        // Force a winning hand for the player (Blackjack with A-J).
        cards: 'A?J?',
      });

      before(async function () {
        playerBalanceBefore = game.player.balance;

        await game.run({ betAmount });
      });

      it('should increase the player balance', function () {
        expect(game.player.balance).to.equal(playerBalanceBefore + betAmount * (3/2))
      });
    });

    context('when autoDeclineInsurance is enabled', function () {
      let game: Game;

      before(function () {
        game = setupGame({
          settings: { autoDeclineInsurance: true },
          playerInput: [],
          // Force a hand that prompts for insurance (dealer Ace).
          cards: '?A',
        });

        game.run();
      });

      it('should not pause for player input', function () {
        expect(game.state.step).to.equal('ask-insurance');
      });
    });

    context('when late surrender is enabled', function () {
      context('when only two cards are dealt', function () {
        before(async function () {
          game = setupGame({
            settings: {
              tableRules: {
                allowLateSurrender: true,
              },
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

          game.run();
        });

        it('should allow late surrender', function () {
          expect(game.state.step).to.equal('game-result');
          expect(game.player.handWinner.values().next().value).to.equal('dealer');
        });
      });

      context('when more than two cards are dealt', function () {
        before(function () {
          game = setupGame({
            settings: {
              tableRules: {
                allowLateSurrender: true,
              },
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

          game.run();
        });

        it('should not allow late surrender', function () {
          expect(game.state.step).to.equal('waiting-for-move');
        });
      });
    });
  });
});
