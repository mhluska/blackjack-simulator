import Utils from './utils';
import Game, { GameSettings } from './game';
import Hand from './hand';
import selectCharts from './charts/utils';
import {
  chartTypes,
  CheckResult,
  actions,
  correctMoves,
  UncommonChart,
} from './types';

function chartMinMax(chartType: chartTypes) {
  switch (chartType) {
    case 'hard':
      return [7, 18];
    case 'soft':
      return [13, 20];
    case 'splits':
      return [2, 11];
  }
}

export default class BasicStrategyChecker {
  static uncommonHands(settings: GameSettings): UncommonChart {
    return selectCharts(settings).uncommon;
  }

  static suggest(game: Game, hand: Hand): correctMoves {
    if (
      game.state.step === 'ask-insurance-right' ||
      game.state.step === 'waiting-for-insurance-input'
    ) {
      return 'N';
    }

    const allowSplit = hand.player.hands.length < game.settings.maxHandsAllowed;

    const { chart: chartGroup } = selectCharts(game.settings);
    const chartType = this._chartType(hand, allowSplit);
    const chart = chartGroup[chartType];
    const [chartMin, chartMax] = chartMinMax(chartType);

    const playerTotal = Utils.clamp(
      hand.hasPairs && allowSplit ? hand.cards[0].value : hand.cardTotal,
      chartMin,
      chartMax
    ) as typeof chartMin;

    const dealersCard = game.dealer.upcard.value;
    const dealerHints = chart[playerTotal - chartMin];
    const correctMove = dealerHints[dealersCard - 2];

    if (correctMove === 'Dh' || correctMove === 'Ds') {
      const allowDouble = hand.firstMove;
      if (allowDouble) {
        return 'D';
      } else {
        return correctMove === 'Dh' ? 'H' : 'S';
      }
    }

    if (correctMove === 'Ph' || correctMove === 'Pd' || correctMove === 'Ps') {
      if (game.settings.allowDoubleAfterSplit) {
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
      return allowSurrender && !game.settings.allowDoubleAfterSplit ? 'R' : 'P';
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
    return hand.firstMove && settings.allowLateSurrender;
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
