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
  });
});
