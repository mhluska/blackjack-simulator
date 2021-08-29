import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';

import BasicStrategyChecker from '../src/basic-strategy-checker';
import HiLoDeviationChecker from '../src/hi-lo-deviation-checker';
import { Event } from '../src/event-emitter';
import Game, { GameSettings } from '../src/game';
import Hand from '../src/Hand';
import Card from '../src/card';
import Utils from '../src/utils';
import {
  DeepPartial,
  Suit,
  Rank,
  GameStep,
  Move,
  HandWinner,
  CheckResult,
} from '../src/types';

const expect = chai.expect;
chai.use(sinonChai);

type GameSetupOptions = {
  settings: DeepPartial<GameSettings>;
  playerCards: Rank[];
  dealerCards: Rank[];
};

function setupGame(options: Partial<GameSetupOptions> = {}) {
  const defaults: GameSetupOptions = {
    settings: {
      debug: !!process.env.DEBUG,
      playerTablePosition: 1,
      playerCount: 1,
    },
    playerCards: [],
    dealerCards: [Rank.Six],
  };

  // TODO: Avoid `as` here. Otherwise returns `Partial<GameSetupOptions>`.
  const mergedOptions = Utils.mergeDeep(defaults, options) as GameSetupOptions;

  const game = new Game(mergedOptions.settings);
  const length = game.shoe.cards.length;

  const setCard = (index: number, rank: Rank): void => {
    if (typeof rank === 'undefined') {
      return;
    }

    game.shoe.cards[length - index - 1] = new Card(
      Suit.Hearts,
      rank,
      game.shoe
    );
  };

  setCard(0, mergedOptions.playerCards[0]);
  setCard(1, mergedOptions.dealerCards[0]);
  setCard(2, mergedOptions.playerCards[1]);
  setCard(3, mergedOptions.dealerCards[1]);

  for (let i = 2; i <= mergedOptions.playerCards.length - 1; i += 1) {
    setCard(i + 2, i + mergedOptions.playerCards[i]);
  }

  return game;
}

function runGame(
  game: Game,
  {
    repeatPlayerInput = false,
    input = [],
  }: {
    repeatPlayerInput?: boolean;
    input?: Partial<{ [key in GameStep]: Move }>[];
  } = {}
) {
  game.betAmount = 10 * 100;

  let callCount = 0;

  do {
    let playerInput: Move | undefined;

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
  } while (game.state.step !== GameStep.Start);
}

describe('Game', function () {
  let game: Game;

  before(function () {
    game = setupGame();
  });

  describe('#run()', function () {
    context('when the shoe needs to be reset', function () {
      let cardsBefore: number;

      before(function () {
        cardsBefore = game.shoe.cards.length;

        let shuffled = false;
        game.on(Event.Shuffle, () => (shuffled = true));

        while (!shuffled) {
          runGame(game, {
            repeatPlayerInput: true,
            input: [
              {
                [GameStep.WaitingForNewGameInput]: Move.Hit,
                [GameStep.WaitingForPlayInput]: Move.Hit,
                [GameStep.WaitingForInsuranceInput]: Move.NoInsurance,
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
        // Force a winning hand for the player (blackjack with A-J).
        dealerCards: [Rank.Two, Rank.Two],
        playerCards: [Rank.Ace, Rank.Jack],
      });

      before(function () {
        playerBalanceBefore = game.player.balance;

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForNewGameInput]: Move.Hit,
            },
          ],
        });
      });

      it('should increase the player balance', function () {
        expect(game.player.balance).to.equal(
          playerBalanceBefore + game.betAmount * (3 / 2)
        );
      });
    });

    context('when autoDeclineInsurance is enabled', function () {
      let game: Game;

      before(function () {
        game = setupGame({
          settings: { autoDeclineInsurance: true },
          // Force a hand that prompts for insurance (dealer Ace).
          dealerCards: [Rank.Ace],
          playerCards: [Rank.Two],
        });

        runGame(game, {
          repeatPlayerInput: true,
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Hit,
              [GameStep.WaitingForNewGameInput]: Move.Hit,
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
            dealerCards: [Rank.Queen, Rank.Jack],
            playerCards: [Rank.Six, Rank.Jack],
          });

          runGame(game, {
            input: [
              {
                [GameStep.WaitingForPlayInput]: Move.Surrender,
              },
              {
                [GameStep.WaitingForNewGameInput]: Move.Hit,
              },
            ],
          });
        });

        it('should allow late surrender', function () {
          expect(game.state.step).to.equal(GameStep.Start);
          expect(game.player.handWinner.values().next().value).to.equal(
            HandWinner.Dealer
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
            dealerCards: [Rank.Queen, Rank.Jack],
            playerCards: [Rank.Six, Rank.Jack, Rank.Two],
          });

          runGame(game, {
            input: [
              {
                [GameStep.WaitingForPlayInput]: Move.Hit,
              },
              {
                [GameStep.WaitingForPlayInput]: Move.Surrender,
              },
            ],
          });
        });

        it('should not allow late surrender', function () {
          expect(game.state.step).to.equal(GameStep.WaitingForPlayInput);
        });
      });
    });

    context('when resplit aces is disabled', function () {
      before(function () {
        game = setupGame({
          settings: {
            allowResplitAces: false,
          },
          // Force a hand where the player has AAv20 (the dealer total is
          // irrelevant). And after splitting, the player is dealt another ace
          // on both hands.
          dealerCards: [Rank.Queen, Rank.Jack],
          playerCards: [Rank.Ace, Rank.Ace, Rank.Ace, Rank.Ace],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Split,
            },
            {
              [GameStep.WaitingForPlayInput]: Move.Split,
            },
          ],
        });
      });

      it('should allow splitting but not resplitting', function () {
        expect(game.player.hands).to.have.lengthOf(2);
      });
    });

    context('when the player is dealt a pair of 5s', function () {
      before(function () {
        game = setupGame({
          dealerCards: [Rank.Six],
          playerCards: [Rank.Five, Rank.Five],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Hit,
            },
          ],
        });
      });

      it('should suggest double as the correct move', function () {
        expect(game.state.sessionMovesTotal).to.equal(1);
        expect(game.state.sessionMovesCorrect).to.equal(0);
        expect(game.state.playCorrection).to.include('double');
      });
    });

    context('when a typical hand is played', function () {
      before(function () {
        sinon.spy(BasicStrategyChecker, 'check');
        sinon.spy(HiLoDeviationChecker, 'check');

        game = setupGame({
          dealerCards: [Rank.Nine],
          playerCards: [Rank.Five, Rank.Three],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Hit,
            },
          ],
        });
      });

      it('checked deviations and basic strategy', function () {
        expect(BasicStrategyChecker.check).to.have.been.calledOnce;
        expect(HiLoDeviationChecker.check).to.have.been.calledOnce;
      });
    });
  });
});
