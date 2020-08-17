import sinon from 'sinon';
import assert from 'assert';
import Game from '../src/game.js';
import Card from '../src/card.js';

describe('Game', function () {
  let game;

  before(function () {
    game = new Game({ animationDelay: 0 });

    sinon
      .stub(game.playerInputReader, 'readInput')
      .callsFake(({ keypress }) => {
        return Promise.resolve(
          {
            'game-result': true,
            'waiting-for-move': 'hit',
            'ask-insurance': 'no-insurance',
          }[game.state.step]
        );
      });
  });

  after(function () {
    game.playerInputReader.readInput.restore();
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

      before(async function () {
        playerBalanceBefore = game.player.balance;

        // Force a winning hand for the player (Blackjack with A-J).
        const hand = game.player.hands[0];
        const length = game.shoe.cards.length;

        game.shoe.cards[length - 1] = new Card('hearts', 'A', hand);
        game.shoe.cards[length - 2] = new Card('hearts', '2', hand);
        game.shoe.cards[length - 3] = new Card('hearts', 'J', hand);
        game.shoe.cards[length - 4] = new Card('hearts', '3', hand);

        await game.step({ betAmount });
      });

      it('should increase the player balance', function () {
        assert.equal(game.player.balance, playerBalanceBefore + betAmount);
      });
    });
  });
});
