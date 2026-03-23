import { expect, use } from 'chai';
import sinonChai from 'sinon-chai';
import sinon from 'sinon';

import BasicStrategyChecker from '../../src/basic-strategy-checker';
import HiLoDeviationChecker, {
  illustrious18Deviations,
} from '../../src/hi-lo-deviation-checker';
import { Event } from '../../src/event-emitter';
import Game, { GameSettings } from '../../src/game';
import Card from '../../src/card';
import Utils from '../../src/utils';
import { isPlayerAttributes } from '../../src/event-types';
import {
  Suit,
  Rank,
  GameStep,
  Move,
  HandWinner,
  GameMode,
  cardRankToValue,
} from '../../src/types';

use(sinonChai);

type GameSetupOptions = {
  settings: Partial<GameSettings>;
  setupDeviationScenario: boolean;
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
    setupDeviationScenario: false,
    playerCards: [],
    dealerCards: [Rank.Six],
  };

  const mergedOptions = Utils.merge(defaults, options);
  const game = new Game(mergedOptions.settings);

  if (mergedOptions.setupDeviationScenario) {
    const playerTotal =
      cardRankToValue(mergedOptions.playerCards[0]) +
      cardRankToValue(mergedOptions.playerCards[1]);
    const dealerTotal = cardRankToValue(mergedOptions.dealerCards[0]);

    const deviation = illustrious18Deviations
      .get(playerTotal)
      ?.get(dealerTotal);

    if (!deviation) {
      throw new Error(
        `No deviation found for ${playerTotal} vs ${dealerTotal}`,
      );
    }
    game.shoe.setupDeviationScenario(playerTotal, dealerTotal, deviation);
  } else {
    const length = game.shoe.cards.length;
    const setCard = (index: number, rank: Rank): void => {
      if (typeof rank === 'undefined') {
        return;
      }

      game.shoe.cards[length - index - 1] = new Card(
        Suit.Hearts,
        rank,
        game.shoe,
      );
    };

    setCard(0, mergedOptions.playerCards[0]);
    setCard(1, mergedOptions.dealerCards[0]);
    setCard(2, mergedOptions.playerCards[1]);
    setCard(3, mergedOptions.dealerCards[1]);

    for (let i = 2; i <= mergedOptions.playerCards.length - 1; i += 1) {
      setCard(i + 2, mergedOptions.playerCards[i]);
    }
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
  } = {},
) {
  game.betAmount = 10 * 100;

  let callCount = 0;

  do {
    let playerInput: Move | undefined;

    const inputChoices = input[callCount];
    if (inputChoices) {
      playerInput = inputChoices[game.state.step];
      if (!playerInput && game.state.step >= 3) {
        throw new Error(`No action provided for game step ${game.state.step}`);
      }
    } else if (!repeatPlayerInput) {
      break;
    }

    if (!repeatPlayerInput && playerInput) {
      callCount += 1;
    }

    game.step(playerInput);
  } while (game.state.step !== GameStep.Start);
}

describe('Game', function () {
  let game: Game;

  before(function () {
    game = setupGame();
  });

  describe('#settings', function () {
    it('should expose current game settings as an instance property', function () {
      const customGame = new Game({
        playerCount: 1,
        playerTablePosition: 1,
        deckCount: 6,
        hitSoft17: false,
        maxHandsAllowed: 2,
      });

      expect(customGame.settings).to.be.an('object');
      expect(customGame.settings.deckCount).to.equal(6);
      expect(customGame.settings.hitSoft17).to.equal(false);
      expect(customGame.settings.maxHandsAllowed).to.equal(2);
    });

    it('should reflect updates from updateSettings', function () {
      const customGame = new Game({
        playerCount: 1,
        playerTablePosition: 1,
      });

      customGame.updateSettings({ deckCount: 8 });
      expect(customGame.settings.deckCount).to.equal(8);
    });
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
      let emittedHandWinner = false;

      const game = setupGame({
        // Force a winning hand for the player (blackjack with A-J).
        dealerCards: [Rank.Two, Rank.Two],
        playerCards: [Rank.Ace, Rank.Jack],
      });

      before(function () {
        playerBalanceBefore = game.player.balance;

        game.on(Event.Change, (name, value) => {
          if (
            name === 'player' &&
            isPlayerAttributes(value) &&
            value.handWinner[value.hands[0].id] === 'player'
          ) {
            emittedHandWinner = true;
          }
        });

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
          playerBalanceBefore + game.betAmount * (3 / 2),
        );
      });

      it('should emit the correct handWinner state', () => {
        expect(emittedHandWinner).to.be.true;
      });
    });

    context('when autoDeclineInsurance is enabled', function () {
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
        expect(game.state.step).not.to.equal(GameStep.WaitingForInsuranceInput);
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
            HandWinner.Dealer,
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

    context('when six deck, stay soft 17 is enabled', function () {
      before(function () {
        game = setupGame({
          settings: {
            hitSoft17: false,
            deckCount: 6,
            allowLateSurrender: true,
          },
          dealerCards: [Rank.Ace, Rank.Six],
          playerCards: [Rank.Six, Rank.Ten, Rank.Ten],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForInsuranceInput]: Move.NoInsurance,
            },
            {
              [GameStep.WaitingForPlayInput]: Move.Hit,
            },
            {
              [GameStep.WaitingForNewGameInput]: Move.Hit,
            },
          ],
        });
      });

      it('should use the six deck, stay soft 17 chart (allow 16vA hit)', function () {
        expect(game.state.step).to.equal(GameStep.Start);
      });
    });

    context('when dealt 8,8 vs Ace with DAS and late surrender', function () {
      before(function () {
        game = setupGame({
          settings: {
            deckCount: 6,
            hitSoft17: true,
            allowDoubleAfterSplit: true,
            allowLateSurrender: true,
          },
          dealerCards: [Rank.Ace, Rank.Seven],
          playerCards: [Rank.Eight, Rank.Eight],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForInsuranceInput]: Move.NoInsurance,
            },
            {
              [GameStep.WaitingForPlayInput]: Move.Surrender,
            },
          ],
        });
      });

      it('should suggest surrender over split', function () {
        expect(game.state.sessionMovesTotal).to.equal(1);
        expect(game.state.sessionMovesCorrect).to.equal(1);
      });
    });

    context('when surrender is allowed', function () {
      before(function () {
        game = setupGame({
          settings: {
            deckCount: 6,
            allowLateSurrender: true,
            mode: GameMode.Deviations,
          },
          setupDeviationScenario: true,
          dealerCards: [Rank.Ten],
          playerCards: [Rank.Six, Rank.Ten],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Surrender,
            },
          ],
        });
      });

      it('should take priority over illustrious 18', function () {
        expect(game.state.sessionMovesTotal).to.equal(1);
        expect(game.state.sessionMovesCorrect).to.equal(1);
      });
    });

    context('when splitting is allowed', function () {
      before(function () {
        game = setupGame({
          settings: {
            deckCount: 6,
            mode: GameMode.Deviations,
          },
          dealerCards: [Rank.Two],
          playerCards: [Rank.Six, Rank.Six],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Split,
            },
          ],
        });
      });

      it('should take priority over illustrious 18', function () {
        expect(game.state.sessionMovesTotal).to.equal(1);
        expect(game.state.sessionMovesCorrect).to.equal(1);
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

    context('when the dealer is dealt a blackjack', function () {
      let emittedBlackjack = false;

      before(function () {
        game = setupGame({
          dealerCards: [Rank.Jack, Rank.Ace],
          playerCards: [Rank.Five, Rank.Five],
        });

        game.on(Event.Change, (name, value) => {
          if (
            name === 'dealer' &&
            isPlayerAttributes(value) &&
            value.hands[0].blackjack
          ) {
            emittedBlackjack = true;
          }
        });

        runGame(game, {
          input: [
            {
              [GameStep.Start]: Move.Hit,
            },
          ],
        });
      });

      after(function () {
        game.removeAllListeners(Event.Change);
      });

      it('should emit correct state for dealer.blackjack', function () {
        expect(emittedBlackjack).to.be.true;
      });
    });

    context(
      'when dealer has blackjack with ace up and autoDeclineInsurance is false',
      function () {
        let playerBalanceBefore: number;

        before(function () {
          game = setupGame({
            settings: {
              autoDeclineInsurance: false,
            },
            dealerCards: [Rank.Ace, Rank.Ten],
            playerCards: [Rank.Five, Rank.Five],
          });

          playerBalanceBefore = game.player.balance;

          // Step to deal initial cards.
          game.step();
        });

        it('should prompt for insurance input', function () {
          expect(game.state.step).to.equal(GameStep.WaitingForInsuranceInput);
        });

        it('should end the round after insurance is declined', function () {
          game.step(Move.NoInsurance);
          expect(game.state.step).to.equal(GameStep.WaitingForNewGameInput);
        });

        it('should mark all hands as dealer wins', function () {
          expect(game.player.handWinner.values().next().value).to.equal(
            HandWinner.Dealer,
          );
        });

        it('should only deduct the initial bet from the player', function () {
          expect(playerBalanceBefore - game.player.balance).to.equal(
            game.betAmount,
          );
        });
      },
    );

    context('when the player splits aces without more aces', function () {
      before(function () {
        game = setupGame({
          dealerCards: [Rank.Six],
          playerCards: [Rank.Ace, Rank.Ace, Rank.Three, Rank.Four],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Split,
            },
          ],
        });
      });

      it('should not allow further action', function () {
        expect(game.state.sessionMovesTotal).to.equal(1);
        expect(game.state.sessionMovesCorrect).to.equal(1);
        expect(game.state.step).to.equal(GameStep.PlayHandsLeft);
      });
    });

    context('when the player splits non-aces', function () {
      before(function () {
        game = setupGame({
          dealerCards: [Rank.Six],
          playerCards: [Rank.Six, Rank.Six, Rank.Ten, Rank.Ten],
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Split,
            },
            {
              [GameStep.WaitingForPlayInput]: Move.Stand,
            },
          ],
        });
      });

      it('should allow further action', function () {
        expect(game.state.sessionMovesTotal).to.equal(2);
        expect(game.state.sessionMovesCorrect).to.equal(2);
        expect(game.state.step).to.equal(GameStep.WaitingForPlayInput);
        expect(game.state.focusedHandIndex).to.equal(1);
      });
    });

    context('when addHand exceeds pre-allocated hands array', function () {
      it('should not crash', function () {
        game = setupGame({
          settings: {
            maxHandsAllowed: 4,
          },
          dealerCards: [Rank.Six],
          playerCards: [Rank.Eight, Rank.Eight],
        });

        // Simulate repeatedly adding hands beyond the pre-allocated limit.
        // The pre-allocated array has maxHandsAllowed * 4 = 16 entries.
        // This should not crash even if handsCount exceeds that.
        const player = game.player;
        for (let i = player.handsCount; i < 20; i += 1) {
          expect(() => player.addHand()).to.not.throw();
        }
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

    context('when resplitting is not allowed', function () {
      before(function () {
        game = setupGame({
          dealerCards: [Rank.Six],
          playerCards: [Rank.Ten, Rank.Ten],
          settings: {
            maxHandsAllowed: 1,
          },
        });

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Stand,
            },
          ],
        });
      });

      it('should use the hard totals chart for suggestions', function () {
        expect(game.state.sessionMovesTotal).to.equal(1);
        expect(game.state.sessionMovesCorrect).to.equal(1);
        expect(game.state.playCorrection).to.equal('');
      });
    });

    context(
      'when dealer has 10-up blackjack and player also has blackjack',
      function () {
        let playerBalanceBefore: number;

        before(function () {
          game = setupGame({
            // Dealer: Jack up, Ace hole = blackjack
            // Player: Ace, King = blackjack
            dealerCards: [Rank.Jack, Rank.Ace],
            playerCards: [Rank.Ace, Rank.King],
          });

          playerBalanceBefore = game.player.balance;

          runGame(game, {
            input: [
              {
                [GameStep.Start]: Move.Hit,
              },
            ],
          });
        });

        it('should be a push (not dealer win)', function () {
          expect(game.player.handWinner.values().next().value).to.equal(
            HandWinner.Push,
          );
        });

        it('should return the full bet to the player', function () {
          expect(game.player.balance).to.equal(playerBalanceBefore);
        });
      },
    );

    context(
      'when dealer has Ace-up blackjack and player also has blackjack',
      function () {
        let playerBalanceBefore: number;

        before(function () {
          game = setupGame({
            settings: {
              autoDeclineInsurance: false,
            },
            // Dealer: Ace up, Ten hole = blackjack
            // Player: Ace, Jack = blackjack
            dealerCards: [Rank.Ace, Rank.Ten],
            playerCards: [Rank.Ace, Rank.Jack],
          });

          playerBalanceBefore = game.player.balance;

          // Step to deal initial cards (will prompt for insurance since dealer has Ace up).
          game.step();
          // Decline insurance.
          game.step(Move.NoInsurance);
        });

        it('should be a push (not dealer win)', function () {
          expect(game.player.handWinner.values().next().value).to.equal(
            HandWinner.Push,
          );
        });

        it('should return the full bet to the player', function () {
          expect(game.player.balance).to.equal(playerBalanceBefore);
        });
      },
    );

    context('when an NPC splits aces and receives non-ace cards', function () {
      let npcPlayer: InstanceType<typeof Game>['players'][number];

      before(function () {
        // Set up a 2-player game: user at position 1, NPC at position 2.
        // The NPC is in playersRight and plays before the user.
        game = new Game({
          debug: !!process.env.DEBUG,
          playerTablePosition: 1,
          playerCount: 2,
        });

        const length = game.shoe.cards.length;
        const setCard = (index: number, rank: Rank): void => {
          game.shoe.cards[length - index - 1] = new Card(
            Suit.Hearts,
            rank,
            game.shoe,
          );
        };

        // Deal order for 2 players (players array reversed: [NPC, User]):
        // Draw 0: NPC first card
        // Draw 1: User first card
        // Draw 2: Dealer upcard
        // Draw 3: NPC second card
        // Draw 4: User second card
        // Draw 5: Dealer hole card
        // Draw 6: NPC first hand card after split
        // Draw 7: NPC new hand card after split

        setCard(0, Rank.Ace); // NPC first card: Ace
        setCard(1, Rank.Ten); // User first card: Ten
        setCard(2, Rank.Six); // Dealer upcard: Six
        setCard(3, Rank.Ace); // NPC second card: Ace
        setCard(4, Rank.Ten); // User second card: Ten
        setCard(5, Rank.Two); // Dealer hole card: Two
        setCard(6, Rank.Seven); // NPC first hand after split: Seven
        setCard(7, Rank.Eight); // NPC new hand after split: Eight

        // Identify the NPC player (playersRight[0]).
        npcPlayer = game.playersRight[0];

        runGame(game, {
          input: [
            {
              [GameStep.WaitingForPlayInput]: Move.Stand,
            },
          ],
        });
      });

      it('should stop NPC hands after one card each (2 cards total per hand)', function () {
        // After splitting aces, each NPC hand should have exactly 2 cards:
        // one ace + one dealt card. The NPC should not hit further.
        expect(npcPlayer.hands).to.have.lengthOf(2);
        expect(npcPlayer.hands[0].cards).to.have.lengthOf(2);
        expect(npcPlayer.hands[1].cards).to.have.lengthOf(2);
      });
    });
  });
});
