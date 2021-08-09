import * as chai from 'chai';
import { Events } from '../src/event-emitter';
import Game, { GameSettings } from '../src/game';
import Card from '../src/card';
import Utils from '../src/utils';
import { DeepPartial, Suits, Ranks, actions, gameSteps } from '../src/types';

type GameSetupOptions = {
  settings: DeepPartial<GameSettings>;
  cards: Ranks[];
};

function setupGame(options: Partial<GameSetupOptions> = {}) {
  const defaults: GameSetupOptions = {
    settings: {
      debug: !!process.env.DEBUG,
      playerTablePosition: 1,
      playerCount: 1,
    },
    cards: [],
  };

  // TODO: Avoid `as` here. Otherwise returns `Partial<GameSetupOptions>`.
  const mergedOptions = Utils.mergeDeep(defaults, options) as GameSetupOptions;

  const game = new Game(mergedOptions.settings);
  const length = game.shoe.cards.length;

  mergedOptions.cards.forEach((cardRank: Ranks, index: number) => {
    game.shoe.cards[length - index - 1] = new Card(
      Suits.HEARTS,
      cardRank,
      game.shoe
    );
  });

  return game;
}

function runGame(
  game: Game,
  {
    repeatPlayerInput = false,
    input = [],
  }: {
    repeatPlayerInput?: boolean;
    input?: Partial<{ [key in gameSteps]: actions }>[];
  } = {}
) {
  let callCount = 0;

  do {
    let playerInput: actions | undefined;

    const inputChoices = input[callCount];
    if (inputChoices) {
      playerInput = inputChoices[game.state.step];
    } else if (!repeatPlayerInput) {
      break;
    }

    if (!repeatPlayerInput) {
      if (playerInput) {
        callCount += 1;
      }
    }

    game.step(playerInput);
  } while (game.state.step !== 'start');
}

const expect = chai.expect;

describe('Game', function () {
  let game: Game;

  before(function () {
    game = setupGame();
  });

  describe('#run()', function () {
    const betAmount = 10 * 100;

    context('when the shoe needs to be reset', function () {
      let cardsBefore: number;

      before(function () {
        cardsBefore = game.shoe.cards.length;

        let shuffled = false;
        game.on(Events.Shuffle, () => (shuffled = true));

        while (!shuffled) {
          runGame(game, {
            repeatPlayerInput: true,
            input: [
              {
                'waiting-for-new-game-input': 'hit',
                'waiting-for-play-input': 'hit',
                'waiting-for-insurance-input': 'no-insurance',
              },
            ],
          });
        }
      });

      it('should move all the cards from the discard tray back to the shoe', function () {
        expect(cardsBefore).to.equal(game.shoe.cards.length);
      });

      it('should reset the hi-lo running count', function () {
        expect(game.shoe.hiLoRunningCount).to.equal(0);
      });
    });

    context('when the player bets and wins', function () {
      let playerBalanceBefore: number;

      const game = setupGame({
        // Force a winning hand for the player (Blackjack with A-J).
        cards: [Ranks.ACE, Ranks.TWO, Ranks.JACK, Ranks.TWO],
      });

      before(function () {
        playerBalanceBefore = game.player.balance;

        game.betAmount = betAmount;

        runGame(game, {
          input: [
            {
              'waiting-for-new-game-input': 'hit',
            },
          ],
        });
      });

      it('should increase the player balance', function () {
        expect(game.player.balance).to.equal(
          playerBalanceBefore + betAmount * (3 / 2)
        );
      });
    });

    context('when autoDeclineInsurance is enabled', function () {
      let game: Game;

      before(function () {
        game = setupGame({
          settings: { autoDeclineInsurance: true },
          // Force a hand that prompts for insurance (dealer Ace).
          cards: [Ranks.TWO, Ranks.ACE],
        });

        game.betAmount = betAmount;
        runGame(game, {
          repeatPlayerInput: true,
          input: [
            {
              'waiting-for-play-input': 'hit',
              'waiting-for-new-game-input': 'hit',
            },
          ],
        });
      });

      it('should not pause for player input', function () {
        expect(game.state.step).not.to.equal('ask-insurance');
      });
    });

    context('when late surrender is enabled', function () {
      context('when only two cards are dealt', function () {
        before(function () {
          game = setupGame({
            settings: {
              allowLateSurrender: true,
            },
            cards: [Ranks.SIX, Ranks.QUEEN, Ranks.JACK, Ranks.JACK],
          });

          game.betAmount = betAmount;

          runGame(game, {
            input: [
              {
                'waiting-for-play-input': 'surrender',
              },
              {
                'waiting-for-new-game-input': 'hit',
              },
            ],
          });
        });

        it('should allow late surrender', function () {
          expect(game.state.step).to.equal('start');
          expect(game.player.handWinner.values().next().value).to.equal(
            'dealer'
          );
        });
      });

      context('when more than two cards are dealt', function () {
        before(function () {
          game = setupGame({
            settings: {
              allowLateSurrender: true,
            },
            // Force a hand where the player has 16v10 and the next card will
            // not bust the player.
            cards: [Ranks.SIX, Ranks.QUEEN, Ranks.JACK, Ranks.JACK, Ranks.TWO],
          });

          game.betAmount = betAmount;

          runGame(game, {
            input: [
              {
                'waiting-for-play-input': 'hit',
              },
              {
                'waiting-for-play-input': 'surrender',
              },
            ],
          });
        });

        it('should not allow late surrender', function () {
          expect(game.state.step).to.equal('waiting-for-play-input');
        });
      });
    });
  });
});
