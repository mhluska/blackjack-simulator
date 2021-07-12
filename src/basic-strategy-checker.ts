import Utils from './utils';
import Game, { GameSettings } from './game';
import Hand from './hand';
import { singleDeck, doubleDeck } from './charts';
import {
  deckCounts,
  chartTypes,
  CheckResult,
  actions,
  correctMoves,
  BasicStrategyData,
  keys,
} from './types';

// TODO: Should this only be used for the first card?
const CHARTS = {
  1: singleDeck,
  2: doubleDeck,

  // TODO: Add more basic strategy charts.
  4: {
    hitsSoft17: {
      chart: { hard: {}, soft: {}, splits: {} },
      uncommon: { hard: {}, soft: {}, splits: {} },
    },
  },
  6: {
    hitsSoft17: {
      chart: { hard: {}, soft: {}, splits: {} },
      uncommon: { hard: {}, soft: {}, splits: {} },
    },
  },
  8: {
    hitsSoft17: {
      chart: { hard: {}, soft: {}, splits: {} },
      uncommon: { hard: {}, soft: {}, splits: {} },
    },
  },
};

export default class BasicStrategyChecker {
  static uncommonHands(
    deckCount: deckCounts
  ): BasicStrategyData['hitsSoft17']['uncommon'] {
    return this._chartData(deckCount).uncommon;
  }

  static suggest(game: Game, hand: Hand): correctMoves | void {
    if (game.state.step === 'ask-insurance') {
      return 'N';
    }

    if (game.state.step === 'waiting-for-move') {
      const allowSplit =
        hand.player.hands.length < game.settings.tableRules.maxHandsAllowed;

      const chartGroup = this._chartGroup(game.settings.tableRules.deckCount);
      const chartType = this._chartType(hand, allowSplit);
      const chart = chartGroup[chartType];

      const chartKeys = keys(chart);
      // TODO: Is there a way to avoid type casts here? Typescript doesn't seem
      // to know that the min of a union type should still be that union type.
      const chartMin = Math.min(...chartKeys) as typeof chartKeys[0];
      const chartMax = Math.max(...chartKeys) as typeof chartKeys[0];
      const playerTotal = Utils.clamp(
        hand.hasPairs && allowSplit ? hand.cards[0].value : hand.cardTotal,
        chartMin,
        chartMax
      ) as typeof chartMin;

      const dealersCard = game.dealer.upcard?.value;
      if (!dealersCard) {
        return;
      }

      const dealerHints = chart[playerTotal];
      if (!dealerHints) {
        return;
      }

      const correctMove = dealerHints[dealersCard];

      if (correctMove === 'Dh' || correctMove === 'Ds') {
        const allowDouble = hand.firstMove;
        if (allowDouble) {
          return 'D';
        } else {
          return correctMove === 'Dh' ? 'H' : 'S';
        }
      }

      // TODO: Add this check.
      const allowDoubleAfterSplit = true;

      if (
        correctMove === 'Ph' ||
        correctMove === 'Pd' ||
        correctMove === 'Ps'
      ) {
        if (allowDoubleAfterSplit) {
          return 'P';
        } else {
          switch (correctMove) {
            case 'Ph':
              return 'H';
            case 'Pd':
              return 'D';
            case 'Ps':
              return 'S';
          }
        }
      }

      const allowSurrender = this._allowSurrender(hand, game.settings);

      if (correctMove === 'Rp') {
        return allowSurrender && allowDoubleAfterSplit ? 'R' : 'P';
      }

      if (correctMove === 'Rh' || correctMove === 'Rs') {
        if (allowSurrender) {
          return 'R';
        } else {
          return correctMove == 'Rh' ? 'H' : 'S';
        }
      }

      return correctMove;
    }
  }

  // Returns true if basic strategy was followed correctly.
  // Returns an object with a `correctMove` code and a `hint` otherwise.
  static check(game: Game, hand: Hand, input: actions): CheckResult | true {
    const correctMove = this.suggest(game, hand);
    if (!correctMove) {
      return true;
    }

    let hint;

    // TODO: Add rationale for each hint.
    if (correctMove === 'N' && input !== 'no-insurance') {
      hint = 'deny insurance';
    }

    if (correctMove === 'H' && input !== 'hit') {
      hint = 'hit';
    }

    if (correctMove === 'S' && input !== 'stand') {
      hint = 'stand';
    }

    if (correctMove === 'D' && input !== 'double') {
      hint = 'double';
    }

    if (correctMove === 'P' && input !== 'split') {
      hint = 'split';
    }

    if (correctMove === 'R' && input !== 'surrender') {
      hint = 'surrender';
    }

    return hint ? this._makeHintResult(correctMove, hint) : true;
  }

  static _makeHintResult(code: CheckResult['code'], hint: string): CheckResult {
    return {
      code,
      hint: `Basic strategy: last play should have been ${hint}!`,
    };
  }

  static _allowSurrender(hand: Hand, settings: GameSettings): boolean {
    return hand.firstMove && settings.tableRules.allowLateSurrender;
  }

  static _chartData(deckCount: deckCounts): BasicStrategyData['hitsSoft17'] {
    // TODO: Allow configuring hits/stands soft 17. Not too important since most
    // tables hit soft 17.
    // TODO: Add charts for remaining deck counts!
    // - 2 deck (stays soft 17)
    // - 4 deck (stays/hits soft 17)
    // - 6 deck (stays/hits soft 17)
    // - 8 deck (stays/hits soft 17)
    // Add an assert that the chart exists.

    return (CHARTS[deckCount] || CHARTS['2']).hitsSoft17;
  }

  static _chartGroup(
    deckCount: deckCounts
  ): BasicStrategyData['hitsSoft17']['chart'] {
    return this._chartData(deckCount).chart;
  }

  static _chartType(hand: Hand, allowSplit: boolean): chartTypes {
    if (hand.hasPairs && allowSplit) {
      return 'splits';
    } else if (hand.isSoft) {
      return 'soft';
    } else {
      return 'hard';
    }
  }
}
