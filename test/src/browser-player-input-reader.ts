import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';

import { Move } from '../../src/types';

const expect = chai.expect;
chai.use(sinonChai);

// Set up minimal DOM globals before importing the browser module.
// The browser player-input-reader expects `document.body` and `HTMLElement`.
class MockHTMLElement {
  dataset: { [key: string]: string } = {};
}
(global as any).HTMLElement = MockHTMLElement;

const listeners: Map<string, Set<EventListener>> = new Map();

const mockBody = {
  addEventListener: sinon
    .stub()
    .callsFake((event: string, handler: EventListener) => {
      if (!listeners.has(event)) {
        listeners.set(event, new Set());
      }
      listeners.get(event)!.add(handler);
    }),
  removeEventListener: sinon
    .stub()
    .callsFake((event: string, handler: EventListener) => {
      listeners.get(event)?.delete(handler);
    }),
};

// Set up the global `document` before importing the module under test.
(global as any).document = { body: mockBody };

import DOMPlayerInputReader from '../../src/browser/player-input-reader';

describe('DOMPlayerInputReader', function () {
  let reader: DOMPlayerInputReader;

  beforeEach(function () {
    reader = new DOMPlayerInputReader();
    listeners.clear();
    mockBody.addEventListener.resetHistory();
    mockBody.removeEventListener.resetHistory();
  });

  describe('#readInput()', function () {
    context('when a keypress event fires with a valid action', function () {
      it('should remove both keypress and click listeners', function () {
        const callback = sinon.stub();
        reader.readInput(callback);

        // Verify both listeners were added.
        expect(mockBody.addEventListener).to.have.been.calledTwice;
        expect(mockBody.addEventListener.firstCall.args[0]).to.equal(
          'keypress'
        );
        expect(mockBody.addEventListener.secondCall.args[0]).to.equal('click');

        // Get the keypress handler that was registered.
        const keypressHandler = mockBody.addEventListener.firstCall.args[1];

        // Simulate a keypress with 'h' (Hit).
        keypressHandler({ key: 'h' });

        // The callback should have been called with Hit.
        expect(callback).to.have.been.calledOnceWith(Move.Hit);

        // Both listeners should have been removed.
        expect(mockBody.removeEventListener).to.have.been.calledWith(
          'click',
          sinon.match.func
        );
        expect(mockBody.removeEventListener).to.have.been.calledWith(
          'keypress',
          keypressHandler
        );
      });
    });

    context('when a click event fires with a valid action', function () {
      it('should remove both click and keypress listeners', function () {
        const callback = sinon.stub();
        reader.readInput(callback);

        const keypressHandler = mockBody.addEventListener.firstCall.args[1];
        const clickHandler = mockBody.addEventListener.secondCall.args[1];

        // Simulate a click on an element with data-action="s" (Stand).
        const mockElement = new MockHTMLElement();
        mockElement.dataset = { action: 's' };
        clickHandler({ target: mockElement });

        // The callback should have been called with Stand.
        expect(callback).to.have.been.calledOnceWith(Move.Stand);

        // Both listeners should have been removed.
        expect(mockBody.removeEventListener).to.have.been.calledWith(
          'click',
          clickHandler
        );
        expect(mockBody.removeEventListener).to.have.been.calledWith(
          'keypress',
          keypressHandler
        );
      });
    });
  });
});
