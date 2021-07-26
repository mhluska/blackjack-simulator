import * as sinon from 'sinon';
import * as chai from 'chai';
import Game, { GameSettings } from '../src/game';
import Card from '../src/card';
import Utils from '../src/utils';
import { DeepPartial, Suits, Ranks, actions } from '../src/types';

type PlayerInput = {
  'game-result': 'next-game';
  'waiting-for-move': actions;
  'ask-insurance': 'ask-insurance' | 'no-insurance';
};

type GameSetupOptions = {
  settings: DeepPartial<GameSettings>;
  repeatPlayerInput: boolean;
  playerInput: PlayerInput[];
  cards: Ranks[];
};

// function setupGame(options: Partial<GameSetupOptions>) {
//   const defaults: GameSetupOptions = {
//     settings: {
//       debug: !!process.env.DEBUG,
//       animationDelay: 0,
//       playerTablePosition: 1,
//       playerCount: 1,
//     },
//     repeatPlayerInput: false,
//     playerInput: [
//       {
//         'game-result': 'next-game',
//         'waiting-for-move': 'hit',
//         'ask-insurance': 'no-insurance',
//       },
//     ],
//     cards: [],
//   };

//   // TODO: Avoid `as` here. Otherwise returns `Partial<GameSetupOptions>`.
//   const mergedOptions = Utils.mergeDeep(defaults, options) as GameSetupOptions;

//   const game = new Game(mergedOptions.settings);
//   const length = game.shoe.cards.length;

//   mergedOptions.cards.forEach((cardRank: Ranks, index: number) => {
//     game.shoe.cards[length - index - 1] = new Card(
//       Suits.HEARTS,
//       cardRank,
//       game.shoe
//     );
//   });

//   let callCount = 0;

//   sinon.stub(game.playerInputReader, 'readInput').callsFake(() => {
//     const promise =
//       mergedOptions.playerInput.length === 0 ||
//       callCount > mergedOptions.playerInput.length - 1
//         ? new Promise<actions>(() => undefined)
//         : Promise.resolve(
//             mergedOptions.playerInput[callCount][game.state.step]
//           );

//     if (callCount < mergedOptions.playerInput.length) {
//       if (
//         callCount !== mergedOptions.playerInput.length - 1 ||
//         !mergedOptions.repeatPlayerInput
//       ) {
//         callCount += 1;
//       }
//     }

//     return promise;
//   });

//   return game;
// }

// const expect = chai.expect;

// describe('Game', function () {
//   let game: Game;

//   before(function () {
//     game = setupGame({
//       repeatPlayerInput: true,
//     });
//   });

//   describe('#run()', function () {
//     context('when the shoe needs to be reset', function () {
//       let cardsBefore: number;

//       before(async function () {
//         cardsBefore = game.shoe.cards.length;

//         let shuffled = false;
//         game.on('shuffle', () => (shuffled = true));
//         while (!shuffled) {
//           await game.run();
//         }
//       });

//       it('should move all the cards from the discard tray back to the shoe', function () {
//         expect(cardsBefore).to.equal(game.shoe.cards.length);
//       });

//       it('should reset the hi-lo running count', function () {
//         expect(game.shoe.hiLoRunningCount).to.equal(0);
//       });
//     });

//     context('when the player bets and wins', function () {
//       let playerBalanceBefore: number;

//       const betAmount = 10 * 100;

//       const game = setupGame({
//         // Force a winning hand for the player (Blackjack with A-J).
//         cards: [Ranks.ACE, Ranks.TWO, Ranks.JACK, Ranks.TWO],
//       });

//       before(async function () {
//         playerBalanceBefore = game.player.balance;

//         await game.run({ betAmount });
//       });

//       it('should increase the player balance', function () {
//         expect(game.player.balance).to.equal(
//           playerBalanceBefore + betAmount * (3 / 2)
//         );
//       });
//     });

//     context('when autoDeclineInsurance is enabled', function () {
//       let game: Game;

//       before(function () {
//         game = setupGame({
//           settings: { autoDeclineInsurance: true },
//           playerInput: [],
//           // Force a hand that prompts for insurance (dealer Ace).
//           cards: [Ranks.TWO, Ranks.ACE],
//         });

//         game.run();
//       });

//       it('should not pause for player input', function () {
//         expect(game.state.step).not.to.equal('ask-insurance');
//       });
//     });

//     context('when late surrender is enabled', function () {
//       context('when only two cards are dealt', function () {
//         before(async function () {
//           game = setupGame({
//             settings: {
//               allowLateSurrender: true,
//             },
//             playerInput: [
//               {
//                 'game-result': 'next-game',
//                 'waiting-for-move': 'surrender',
//                 'ask-insurance': 'no-insurance',
//               },
//             ],
//             cards: [Ranks.SIX, Ranks.QUEEN, Ranks.JACK, Ranks.JACK],
//           });

//           game.run();
//         });

//         it('should allow late surrender', function () {
//           expect(game.state.step).to.equal('game-result');
//           expect(game.player.handWinner.values().next().value).to.equal(
//             'dealer'
//           );
//         });
//       });

//       context('when more than two cards are dealt', function () {
//         before(function () {
//           game = setupGame({
//             settings: {
//               allowLateSurrender: true,
//             },
//             playerInput: [
//               {
//                 'game-result': 'next-game',
//                 'waiting-for-move': 'hit',
//                 'ask-insurance': 'no-insurance',
//               },
//               {
//                 'game-result': 'next-game',
//                 'waiting-for-move': 'surrender',
//                 'ask-insurance': 'no-insurance',
//               },
//             ],
//             // Force a hand where the player has 16v10 and the next card will
//             // not bust the player.
//             cards: [Ranks.SIX, Ranks.QUEEN, Ranks.JACK, Ranks.JACK, Ranks.TWO],
//           });

//           game.run();
//         });

//         it('should not allow late surrender', function () {
//           expect(game.state.step).to.equal('waiting-for-move');
//         });
//       });
//     });
//   });
// });
