import { expect } from 'chai';

import Game from '../../src/game';
import CLIRenderer from '../../src/cli-renderer';
import Card from '../../src/card';
import { Suit, Rank, GameStep, Move, HandWinner } from '../../src/types';

function setupPushGame() {
  const game = new Game({
    debug: process.env.DEBUG != null && process.env.DEBUG !== '',
    playerTablePosition: 1,
    playerCount: 1,
  });

  const length = game.shoe.cards.length;
  const setCard = (index: number, rank: Rank): void => {
    game.shoe.cards[length - index - 1] = new Card(
      Suit.Hearts,
      rank,
      game.shoe,
    );
  };

  // Set up a scenario where both player and dealer have 20 (push).
  // Deal order: player card 1, dealer upcard, player card 2, dealer hole card.
  setCard(0, Rank.Ten); // Player first card: Ten (10)
  setCard(1, Rank.King); // Dealer upcard: King (10)
  setCard(2, Rank.Queen); // Player second card: Queen (10)
  setCard(3, Rank.Jack); // Dealer hole card: Jack (10)

  return game;
}

describe('CLIRenderer', function () {
  describe('#_questionLine()', function () {
    context('when the hand result is a push', function () {
      let renderer: CLIRenderer;
      let game: Game;

      before(function () {
        game = setupPushGame();
        game.betAmount = 10 * 100;

        // Override _setupCliInput and _renderLine since we are in a test
        // environment without a TTY.
        CLIRenderer.prototype._setupCliInput = function () {
          // no-op
        };
        CLIRenderer.prototype._renderLines = function () {
          // no-op
        };

        renderer = new CLIRenderer(game);

        // Step through the game: deal cards.
        game.step();

        // Play right-side NPCs (none in single player).
        game.step();

        // Player stands with 20.
        game.step(Move.Stand);

        // Play left-side NPCs and dealer. Dealer also has 20, so it's a push.
        game.step();

        // Now the game should be in WaitingForNewGameInput.
        expect(game.state.step).to.equal(GameStep.WaitingForNewGameInput);
        expect(game.player.handWinner.values().next().value).to.equal(
          HandWinner.Push,
        );
      });

      it('should return a string containing "Push" not a number', function () {
        const questionLine = renderer._questionLine();

        // The bug: HandWinner.Push is a numeric enum value (2), so the old
        // code returned the number 2 instead of the string "Push".
        expect(questionLine).to.be.a('string');
        expect(questionLine).to.include('Push');
        expect(questionLine).not.to.match(/\b2\b/);
      });

      it('should include "Push" in the outputLines', function () {
        const lines = renderer.outputLines;

        // The question line is the last element.
        const questionLine = lines[lines.length - 1];
        expect(questionLine).to.be.a('string');
        expect(questionLine).to.include('Push');
      });
    });
  });
});
