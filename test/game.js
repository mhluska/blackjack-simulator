import sinon from 'sinon';
import assert from 'assert';
import Game from '../src/game.js';

describe('Game', function () {
  let game;

  before(function () {
    game = new Game({ animationDelay: 0 });

    sinon
      .stub(game.playerInputReader, 'readInput')
      .callsFake(({ keypress }) => {
        if (game.state.step === 'game-result') {
          return Promise.resolve(keypress(true));
        } else {
          return Promise.resolve(keypress('h'));
        }
      });
  });

  after(function () {
    game.playerInputReader.readInput.restore();
  });

  describe('#start()', function () {
    context('when the shoe needs to be reset', function () {
      let cardsBefore;

      before(async function () {
        cardsBefore = game.shoe.cards.length;

        let shuffled = false;
        game.on('shuffle', () => (shuffled = true));
        while (!shuffled) {
          await game.start();
        }
      });

      it('should move all the cards from the discard tray back to the shoe', function () {
        assert.equal(cardsBefore, game.shoe.cards.length);
      });

      it('should reset the hi-lo running count', function () {
        assert.equal(game.shoe.hiLoRunningCount, 0);
      });
    });
  });
});
